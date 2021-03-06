import server from "./server.js";
import appContext from "./app_context.js";
import utils from './utils.js';

// this key needs to have this value so it's hit by the tooltip
const SELECTED_NOTE_PATH_KEY = "data-note-path";

async function autocompleteSource(term, cb) {
    const result = await server.get('autocomplete'
        + '?query=' + encodeURIComponent(term)
        + '&activeNoteId=' + appContext.tabManager.getActiveTabNoteId());

    cb(result);
}

function clearText($el) {
    if (utils.isMobile()) {
        return;
    }

    $el.setSelectedNotePath("");
    $el.autocomplete("val", "").trigger('change');
}

function showRecentNotes($el) {
    if (utils.isMobile()) {
        return;
    }

    $el.setSelectedNotePath("");
    $el.autocomplete("val", "");
    $el.trigger('focus');
}

function initNoteAutocomplete($el, options) {
    if ($el.hasClass("note-autocomplete-input") || utils.isMobile()) {
        return $el;
    }

    options = options || {};

    $el.addClass("note-autocomplete-input");

    const $clearTextButton = $("<a>")
            .addClass("input-group-text input-clearer-button bx bx-x")
            .prop("title", "Clear text field");

    const $showRecentNotesButton = $("<a>")
            .addClass("input-group-text show-recent-notes-button bx bx-time")
            .prop("title", "Show recent notes");

    const $goToSelectedNoteButton = $("<a>")
        .addClass("input-group-text go-to-selected-note-button bx bx-arrow-to-right")
        .attr("data-action", "note");

    const $sideButtons = $("<div>")
        .addClass("input-group-append")
        .append($clearTextButton)
        .append($showRecentNotesButton);

    if (!options.hideGoToSelectedNoteButton) {
        $sideButtons.append($goToSelectedNoteButton);
    }

    $el.after($sideButtons);

    $clearTextButton.on('click', () => clearText($el));

    $showRecentNotesButton.on('click', e => {
        showRecentNotes($el);

        // this will cause the click not give focus to the "show recent notes" button
        // this is important because otherwise input will lose focus immediatelly and not show the results
        return false;
    });

    $el.autocomplete({
        appendTo: document.querySelector('body'),
        hint: false,
        autoselect: true,
        openOnFocus: true,
        minLength: 0,
        tabAutocomplete: false
    }, [
        {
            source: autocompleteSource,
            displayKey: 'notePathTitle',
            templates: {
                suggestion: function(suggestion) {
                    return suggestion.highlightedNotePathTitle;
                }
            },
            // we can't cache identical searches because notes can be created / renamed, new recent notes can be added
            cache: false
        }
    ]);

    $el.on('autocomplete:selected', (event, suggestion) => {
        $el.setSelectedNotePath(suggestion.notePath);

        $el.autocomplete("val", suggestion.noteTitle);
    });

    $el.on('autocomplete:closed', () => {
        if (!$el.val().trim()) {
            clearText($el);
        }
    });

    $el.on('autocomplete:opened', () => {
        if ($el.attr("readonly")) {
            $el.autocomplete('close');
        }
    });

    return $el;
}

function init() {
    $.fn.getSelectedNotePath = function () {
        if (!$(this).val().trim()) {
            return "";
        } else {
            return $(this).attr(SELECTED_NOTE_PATH_KEY);
        }
    };

    $.fn.getSelectedNoteId = function () {
        const notePath = $(this).getSelectedNotePath();
        const chunks = notePath.split('/');

        return chunks.length >= 1 ? chunks[chunks.length - 1] : null;
    }

    $.fn.setSelectedNotePath = function (notePath) {
        notePath = notePath || "";

        $(this).attr(SELECTED_NOTE_PATH_KEY, notePath);

        $(this)
            .closest(".input-group")
            .find(".go-to-selected-note-button")
            .toggleClass("disabled", !notePath.trim())
            .attr(SELECTED_NOTE_PATH_KEY, notePath); // we also set attr here so tooltip can be displayed
    };
}

export default {
    autocompleteSource,
    initNoteAutocomplete,
    showRecentNotes,
    init
}
