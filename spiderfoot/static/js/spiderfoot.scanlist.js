globalTypes = null;
globalFilter = null;
lastChecked = null;

function switchSelectAll() {
    if (!$("#checkall")[0].checked) {
        $("input[id*=cb_]").prop('checked', false);
    } else {
        $("input[id*=cb_]").prop('checked', true);
    }
}

function filter(type) {
    if (type == "all") {
        showlist();
        return;
    }
    if (type == "running") {
        showlist(["RUNNING", "STARTING", "STARTED", "INITIALIZING"], "Running");
        return;
    }
    if (type == "finished") {
        showlist(["FINISHED"], "Finished");
        return;
    }
    if (type == "failed") {
        showlist(["ABORTED", "FAILED"], "Failed/Aborted");
        return;
    }
}

function getSelected() {
    ids = [];
    $("input[id*=cb_]").each(function(i, obj) {
        if (obj.checked) {
            ids[ids.length] = obj.id.replace("cb_", "");
        }
    });

    if (ids.length == 0)
        return false;

    return ids;
}

function stopScan(id) {
    alertify.confirm(t("are_you_sure_stop", "Are you sure you wish to stop this scan?"),
    function(){
        sf.stopScan(id, reload);
    }).set({title: t("stop_scan_title", "Stop scan?")});
}

function stopSelected() {
    ids = getSelected();
    if (!ids) {
        alertify.message(t("could_not_stop", "Could not stop scans. No scans selected."));
        return;
    }

    var msg = t("are_you_sure_stop_multi", "Are you sure you wish to stop these {count} scans?<br/><br/>{list}")
        .replace("{count}", ids.length)
        .replace("{list}", ids.join("<br/>"));
    alertify.confirm(msg,
    function(){
        sf.stopScan(ids.join(','), reload);
    }).set({title: t("stop_scans_title", "Stop scans?")});
}

function deleteScan(id) {
    alertify.confirm(t("are_you_sure_delete", "Are you sure you wish to delete this scan?"),
    function(){
        sf.deleteScan(id, reload);
    }).set({title: t("delete_scan_title", "Delete scan?")});
}

function deleteSelected() {
    ids = getSelected();
    if (!ids) {
        alertify.message(t("could_not_delete", "Could not delete scans. No scans selected."));
        return;
    }

    var msg = t("are_you_sure_delete_multi", "Are you sure you wish to delete these {count} scans?<br/><br/>{list}")
        .replace("{count}", ids.length)
        .replace("{list}", ids.join("<br/>"));
    alertify.confirm(msg,
    function(){
        sf.deleteScan(ids.join(','), reload);
    }).set({title: t("delete_scans_title", "Delete scans?")});
}

function rerunSelected() {
    ids = getSelected();
    if (!ids) {
        alertify.message(t("could_not_rerun", "Could not re-run scan. No scans selected."));
        return;
    }

    sf.log("Re-running scans: " + ids.join(','));
    window.location.href = docroot + '/rerunscanmulti?ids=' + ids.join(',');
}

function exportSelected(type) {
    ids = getSelected();

    if (!ids) {
        sf.log("Error: no scan(s) selected");
        return;
    }

    $("#loader").show();
    var efr = document.getElementById('exportframe');
    switch(type) {
        case "gexf":
            sf.log("Exporting scans as " + type + ": " + ids.join(','));
            efr.src = docroot + '/scanvizmulti?ids=' + ids.join(',');
            break;
        case "csv":
            sf.log("Exporting scans as " + type + ": " + ids.join(','));
            efr.src = docroot + '/scaneventresultexportmulti?ids=' + ids.join(',');
            break;
        case "excel":
            sf.log("Exporting scans as " + type + ": " + ids.join(','));
            efr.src = docroot + '/scaneventresultexportmulti?filetype=excel&ids=' + ids.join(',');
            break;
        case "json":
            sf.log("Exporting scans as " + type + ": " + ids.join(','));
            efr.src = docroot + '/scanexportjsonmulti?ids=' + ids.join(',');
            break;
        default:
            sf.log("Error: Invalid export type: " + type);
    }
    $("#loader").fadeOut(500);
}

function reload() {
    $("#loader").show();
    showlist(globalTypes, globalFilter);
    return;
}

function showlist(types, filter) {
    globalTypes = types;
    globalFilter = filter;

    var lang = localStorage.getItem("lang") || "fa";
    var translationsUrl = (typeof docroot !== "undefined" ? docroot : "") + "/static/js/translations_" + lang + ".json";

    var doRender = function(data) {
        if (data.length == 0) {
            $("#loader").fadeOut(500);
            var welcome = "<div class='alert alert-info'>";
            welcome += "<h4>" + t("no_scan_history", "No scan history") + "</h4><br>";
            welcome += t("no_scan_history_help", "There is currently no history of previously run scans. Please click 'New Scan' to initiate a new scan.");
            welcome += "</div>";
            $("#scancontent").append(welcome);
            return;
        }
        showlisttable(types, filter, data);
    };

    sf.fetchData(docroot + '/scanlist', null, function(data) {
        if (!window.translations) {
            fetch(translationsUrl)
                .then(function(res) { return res.json(); })
                .then(function(tr) {
                    window.translations = tr;
                    doRender(data);
                })
                .catch(function() { doRender(data); });
        } else {
            doRender(data);
        }
    });
}

function showlisttable(types, filter, data) {
    if (filter == null) {
        filter = "None";
    }
    // Map filter label to correct translation key
    var filterKeyMap = { "none": "none", "running": "running", "finished": "completed", "failed/aborted": "aborted" };
    var filterKey = filterKeyMap[filter.toLowerCase()] || filter.toLowerCase();
    var buttons = "<div class='btn-toolbar'>";
    buttons += "<div class='btn-group'>";
    buttons += "<button id='btn-filter' class='btn btn-default'><i class='glyphicon glyphicon-filter'></i>&nbsp;<span data-translate='filter'>" + t("filter", "Filter") + "</span>: " + t(filterKey, filter) + "</button>";
    buttons += "<button class='btn dropdown-toggle btn-default' data-toggle='dropdown'><span class='caret'></span></button>";
    buttons += "<ul class='dropdown-menu'>";
    buttons += "<li><a href='javascript:filter(\"all\")'>" + t("none", "All") + "</a></li>";
    buttons += "<li><a href='javascript:filter(\"running\")'>" + t("running", "Running") + "</a></li>";
    buttons += "<li><a href='javascript:filter(\"finished\")'>" + t("completed", "Finished") + "</a></li>";
    buttons += "<li><a href='javascript:filter(\"failed\")'>"+  t("aborted", "Failed/Aborted") + "</a></li></ul>";
    buttons += "</div>";

    buttons += "<div class='btn-group pull-right'>";
    buttons += "<button rel='tooltip' data-title='" + t("delete_selected", "Delete Selected") + "' id='btn-delete' class='btn btn-default btn-danger'><i class='glyphicon glyphicon-trash glyphicon-white'></i></button>";
    buttons += "</div>";

    buttons += "<div class='btn-group pull-right'>";
    buttons += "<button rel='tooltip' data-title='" + t("refresh", "Refresh") + "' id='btn-refresh' class='btn btn-default btn-success'><i class='glyphicon glyphicon-refresh glyphicon-white'></i></a>";
    buttons += "<button rel='tooltip' data-toggle='dropdown' data-title='" + t("export_selected", "Export Selected") + "' id='btn-export' class='btn btn-default btn-success dropdown-toggle download-button'><i class='glyphicon glyphicon-download-alt glyphicon-white'></i></button>";
    buttons += "<ul class='dropdown-menu'>";
    buttons += "<li><a href='javascript:exportSelected(\"csv\")'>CSV</a></li>";
    buttons += "<li><a href='javascript:exportSelected(\"excel\")'>Excel</a></li>";
    buttons += "<li><a href='javascript:exportSelected(\"gexf\")'>GEXF</a></li>";
    buttons += "<li><a href='javascript:exportSelected(\"json\")'>JSON</a></li>";
    buttons += "</ul>";
    buttons += "</div>";

    buttons += "<div class='btn-group pull-right'>";
    buttons += "<button rel='tooltip' data-title='" + t("rerun_selected", "Re-run Selected") + "' id='btn-rerun' class='btn btn-default'><i class='glyphicon glyphicon-repeat glyphicon-white'></i></button>";
    buttons += "<button rel='tooltip' data-title='" + t("stop_selected", "Stop Selected") + "' id='btn-stop' class='btn btn-default'>";
    buttons += "<i class='glyphicon glyphicon-stop glyphicon-white'></i></button>";
    buttons += "</div>";

    buttons += "</div>";
    var table = "<table id='scanlist' class='table table-bordered table-striped'>";
    table += "<thead><tr><th class='sorter-false text-center'><input id='checkall' type='checkbox'></th> <th>" + t("name", "Name") + "</th> <th>" + t("target", "Target") + "</th> <th>" + t("started", "Started") + "</th> <th>" + t("finished", "Finished") + "</th> <th class='text-center'>" + t("status", "Status") + "</th> <th class='text-center'>" + t("total", "Elements") + "</th><th class='text-center'>" + t("correlation_rules", "Correlations") + "</th><th class='sorter-false text-center'>" + t("action", "Action") + "</th> </tr></thead><tbody>";
    filtered = 0;
    for (var i = 0; i < data.length; i++) {
        if (types != null && $.inArray(data[i][6], types)) {
            filtered++;
            continue;
        }
        table += "<tr><td class='text-center'><input type='checkbox' id='cb_" + data[i][0] + "'></td>"
        table += "<td><a href=" + docroot + "/scaninfo?id=" + data[i][0] + ">" + data[i][1] + "</a></td>";
        table += "<td>" + data[i][2] + "</td>";
        table += "<td>" + data[i][3] + "</td>";
        var finishedVal = data[i][4];
        if (finishedVal && (finishedVal.toLowerCase() === "not yet" || finishedVal === "-" || finishedVal === "")) {
            finishedVal = t("not_yet", "Not yet");
        }
        table += "<td>" + finishedVal + "</td>";

        var statusy = "";

        if (data[i][6] == "FINISHED") {
            statusy = "alert-success";
        } else if (data[i][6].indexOf("ABORT") >= 0) {
            statusy = "alert-warning";
        } else if (data[i][6] == "CREATED" || data[i][6] == "RUNNING" || data[i][6] == "STARTED" || data[i][6] == "STARTING" || data[i][6] == "INITIALIZING") {
            statusy = "alert-info";
        } else if (data[i][6].indexOf("FAILED") >= 0) {
            statusy = "alert-danger";
        } else {
            statusy = "alert-info";
        }
        var statusLabel = data[i][6].toLowerCase();
        var statusText = t(statusLabel, data[i][6]);
        table += "<td class='text-center'><span class='badge " + statusy + "'>" + statusText + "</span></td>";
        table += "<td class='text-center'>" + data[i][7] + "</td>";
        table += "<td class='text-center'>";
        table += "<span class='badge alert-danger'>" + data[i][8]['HIGH'] + "</span>";
        table += "<span class='badge alert-warning'>" + data[i][8]['MEDIUM'] + "</span>";
        table += "<span class='badge alert-info'>" + data[i][8]['LOW'] + "</span>";
        table += "<span class='badge alert-success'>" + data[i][8]['INFO'] + "</span>";
        table += "</td>";
        table += "<td class='text-center'>";
        if (data[i][6] == "RUNNING" || data[i][6] == "STARTING" || data[i][6] == "STARTED" || data[i][6] == "INITIALIZING") {
            table += "<a rel='tooltip' title='" + t("stop_scan", "Stop Scan") + "' href='javascript:stopScan(\"" + data[i][0] + "\");'><i class='glyphicon glyphicon-stop text-muted'></i></a>";
        } else {
            table += "<a rel='tooltip' title='" + t("delete_scan", "Delete Scan") + "' href='javascript:deleteScan(\"" + data[i][0] + "\");'><i class='glyphicon glyphicon-trash text-muted'></i></a>";
            table += "&nbsp;&nbsp;<a rel='tooltip' title='" + t("rerun_scan", "Re-run Scan") + "' href=" + docroot + "/rerunscan?id=" + data[i][0] + "><i class='glyphicon glyphicon-repeat text-muted'></i></a>";
        }
        table += "&nbsp;&nbsp;<a rel='tooltip' title='" + t("clone_scan", "Clone Scan") + "' href=" + docroot + "/clonescan?id=" + data[i][0] + "><i class='glyphicon glyphicon-plus-sign text-muted'></i></a>";
        table += "</td></tr>";
    }

    table += '</tbody><tfoot><tr><th colspan="8" class="ts-pager form-inline">';
    table += '<div class="btn-group btn-group-sm" role="group">';
    table += '<button type="button" class="btn btn-default first"><span class="glyphicon glyphicon-step-backward"></span></button>';
    table += '<button type="button" class="btn btn-default prev"><span class="glyphicon glyphicon-backward"></span></button>';
    table += '</div>';
    table += '<div class="btn-group btn-group-sm" role="group">';
    table += '<button type="button" class="btn btn-default next"><span class="glyphicon glyphicon-forward"></span></button>';
    table += '<button type="button" class="btn btn-default last"><span class="glyphicon glyphicon-step-forward"></span></button>';
    table += '</div>';
    table += '<select class="form-control input-sm pagesize" title="Select page size">';
    table += '<option selected="selected" value="10">10</option>';
    table += '<option value="20">20</option>';
    table += '<option value="30">30</option>';
    table += '<option value="all">All Rows</option>';
    table += '</select>';
    table += '<select class="form-control input-sm pagenum" title="Select page number"></select>';
    table += '<span class="pagedisplay pull-right"></span>';
    table += '</th></tr></tfoot>';
    table += "</table>";

    $("#loader").fadeOut(500);
    $("#scancontent-wrapper").remove();
    $("#scancontent").append("<div id='scancontent-wrapper'> " + buttons + table + "</div>");
    sf.updateTooltips();
    $("#scanlist").tablesorter().tablesorterPager({
      container: $(".ts-pager"),
      cssGoto: ".pagenum",
      output: 'Scans {startRow} - {endRow} / {filteredRows} ({totalRows})'
    });
    $("[class^=tooltip]").remove();

    $(document).ready(function() {
        var chkboxes = $('input[id*=cb_]');
        chkboxes.click(function(e) {
            if(!lastChecked) {
                lastChecked = this;
                return;
            }

            if(e.shiftKey) {
                var start = chkboxes.index(this);
                var end = chkboxes.index(lastChecked);

                chkboxes.slice(Math.min(start,end), Math.max(start,end)+ 1).prop('checked', lastChecked.checked);
            }

            lastChecked = this;
        });

        $("#btn-delete").click(function() { deleteSelected(); });
        $("#btn-refresh").click(function() { reload(); });
        $("#btn-rerun").click(function() { rerunSelected(); });
        $("#btn-stop").click(function() { stopSelected(); });
        $("#checkall").click(function() { switchSelectAll(); });
    });

    if (typeof window.translatePage === "function") {
        window.translatePage();
    }
}

showlist();

