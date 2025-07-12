localStorage.open = localStorage.open || JSON.stringify({
        add: 'click',
        replace: 'shift+click',
        new: 'ctrl/cmd+click',
        incognito: 'alt+click'
});
localStorage.pinned = localStorage.pinned || 'skip';

$("select").each(function () {
	$(this)
		.append('<option value="none">&lt;none&gt;</option>')
		.append('<option value="click">click</option>')
		.append('<option value="shift+click">shift+click</option>')
		.append('<option value="ctrl/cmd+click">ctrl/cmd+click</option>')
		.append('<option value="alt+click">alt/opt+click</option>')
		.find("option[value='" + JSON.parse(localStorage.open)[this.id.split("-")[1]] + "']").prop("selected", true);
}).change(function () {
        var open = JSON.parse(localStorage.open);
        open[this.id.split("-")[1]] = this.value;
        localStorage.open = JSON.stringify(open);
        syncChromeStorage();
});

$("[name='pinned-save']").change(function () {
        localStorage.pinned = this.value;
        syncChromeStorage();
}).filter("[value='" + localStorage.pinned + "']").prop("checked", true);

$("#pinned-noreplace").change(function () {
	if (this.checked) {
                localStorage.noreplacingpinned = true;
        } else {
                delete localStorage.noreplacingpinned;
        }
        syncChromeStorage();
}).prop("checked", localStorage.noreplacingpinned === "true");

function syncChromeStorage() {
        chrome.storage.local.set({
                open: localStorage.open,
                pinned: localStorage.pinned,
                noreplacingpinned: localStorage.noreplacingpinned
        });
}
