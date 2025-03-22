const KEY_CODE_TILDE = 192;
const KEY_CODE_ESCAPE = 27;
const container = document.body;
const editorInput = editor.getTextArea(); //document.querySelector(".simple-editor-input");

window.addEventListener("keydown", (event)=> {
	var wasOpen = container.classList.contains("editor-open");
	if (event.keyCode === KEY_CODE_ESCAPE) {
		container.classList.remove("editor-open");
	}
	if (!event.target.classList.contains("simple-console-input") &&		/// Z#20250315
		!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.defaultPrevented)
	) {
		// TODO: if needed to type tildes/backticks, perhaps require a modifier like Ctrl+` / Ctrl+~ as the shortcut
		// if (event.keyCode === KEY_CODE_TILDE && (event.ctrlKey || event.metaKey)) {
		if (event.keyCode === KEY_CODE_TILDE) {
			container.classList.toggle("editor-open");
		}
	}
	else if (event.keyCode === KEY_CODE_TILDE && (event.ctrlKey || event.altKey))
	{
		container.classList.toggle("editor-open");
	}
	var nowOpen = container.classList.contains("editor-open");
	if (wasOpen !== nowOpen) {
		event.preventDefault();
		if (nowOpen) {
			editorInput.focus();
		} else {
			editorInput.blur();
			pycon.input.focus();
		}
	}
});

var initiallyOpen = container.classList.contains("editor-open");
if (document.activeElement === editorInput && !initiallyOpen) {
	editorInput.blur();
}