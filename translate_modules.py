# -*- coding: utf-8 -*-
import os
import sys
import json
import time
import urllib.request
import urllib.parse

def translate_text(texts, src='en', dest='fa'):
    # Join texts with a unique delimiter to translate in batch
    delimiter = " \n---\n "
    query = delimiter.join(texts)
    
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + src + "&tl=" + dest + "&dt=t&q=" + urllib.parse.quote(query)
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        translated_parts = []
        for part in data[0]:
            if part[0]:
                translated_parts.append(part[0])
                
        translated_full = "".join(translated_parts)
        translated_texts = [t.strip() for t in translated_full.split("---")]
        
        # Verify length matches
        if len(translated_texts) != len(texts):
            # Fallback to individual translation if mismatch
            print(f"Batch mismatch (expected {len(texts)}, got {len(translated_texts)}). Falling back to individual translation...")
            individual_translations = []
            for t in texts:
                individual_translations.append(translate_single(t, src, dest))
                time.sleep(0.2)
            return individual_translations
            
        return translated_texts
    except Exception as e:
        print(f"Translation error: {e}. Falling back to individual translation...")
        individual_translations = []
        for t in texts:
            individual_translations.append(translate_single(t, src, dest))
            time.sleep(0.2)
        return individual_translations

def translate_single(text, src='en', dest='fa'):
    if not text:
        return ""
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + src + "&tl=" + dest + "&dt=t&q=" + urllib.parse.quote(text)
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
        parts = [part[0] for part in data[0] if part[0]]
        return "".join(parts).strip()
    except Exception as e:
        print(f"Error translating '{text}': {e}")
        return text

def main():
    sys.path.insert(0, os.path.abspath('.'))
    
    # 1. Discover modules
    mod_dir = './modules/'
    if not os.path.isdir(mod_dir):
        print("Modules directory not found.")
        sys.exit(-1)
        
    modules_metadata = []
    
    for filename in os.listdir(mod_dir):
        if not filename.endswith(".py") or not filename.startswith("sfp_") or filename == 'sfp_template.py':
            continue
            
        modName = filename.split('.')[0]
        try:
            mod = __import__('modules.' + modName, globals(), locals(), [modName])
            obj = getattr(mod, modName)()
            meta = obj.meta
            name = meta.get('name', modName)
            summary = meta.get('summary', '')
            modules_metadata.append({
                'id': modName,
                'name': name,
                'descr': summary
            })
        except Exception as e:
            print(f"Failed to load module {modName}: {e}")
            
    print(f"Loaded {len(modules_metadata)} modules successfully.")
    
    # Load existing translations
    trans_path = './spiderfoot/static/js/translations_fa.json'
    if os.path.exists(trans_path):
        with open(trans_path, 'r', encoding='utf-8') as f:
            translations = json.load(f)
    else:
        translations = {}
        
    # We will collect texts to translate
    to_translate_names = []
    to_translate_descrs = []
    
    name_keys = []
    descr_keys = []
    
    for mod in modules_metadata:
        name_key = f"module_{mod['id']}_name"
        descr_key = f"module_{mod['id']}_descr"
        
        if name_key not in translations:
            to_translate_names.append(mod['name'])
            name_keys.append(name_key)
            
        if descr_key not in translations:
            to_translate_descrs.append(mod['descr'])
            descr_keys.append(descr_key)
            
    print(f"Need to translate {len(to_translate_names)} names and {len(to_translate_descrs)} descriptions.")
    
    # Translate names in batches of 20
    batch_size = 20
    for i in range(0, len(to_translate_names), batch_size):
        batch = to_translate_names[i:i+batch_size]
        batch_keys = name_keys[i:i+batch_size]
        print(f"Translating names batch {i//batch_size + 1}...")
        translated = translate_text(batch)
        for k, val in zip(batch_keys, translated):
            translations[k] = val
        time.sleep(1)
        
    # Translate descriptions in batches of 10 (descriptions are longer)
    batch_size = 10
    for i in range(0, len(to_translate_descrs), batch_size):
        batch = to_translate_descrs[i:i+batch_size]
        batch_keys = descr_keys[i:i+batch_size]
        print(f"Translating descriptions batch {i//batch_size + 1}...")
        translated = translate_text(batch)
        for k, val in zip(batch_keys, translated):
            translations[k] = val
        time.sleep(1)
        
    # Save the updated translations file
    with open(trans_path, 'w', encoding='utf-8') as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)
        
    print("Translation completed successfully!")

if __name__ == "__main__":
    main()
