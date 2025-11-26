(function ($) {
  "use strict";

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ---------------------------
  // RENDER TEMPLATE GRID
  // ---------------------------
  function buildTemplatesGrid() {
    const panel = $("#ef-templates-panel").empty();
    const templates = ExpliFormsData.templates;

    templates.forEach((tpl) => {
      const card = $(`
                <div class="ef-template-card">
                    <img class="ef-template-thumb" src="${tpl.thumbnail}">
                    <div class="ef-template-name">${tpl.name}</div>
                    <button class="ef-btn ef-use">Use</button>
                </div>
            `);

      card.find(".ef-use").on("click", () => {
        openEditor(tpl);
      });

      panel.append(card);
    });
  }

  // ---------------------------
  // OPEN EDITOR WINDOW
  // ---------------------------
  function openEditor(tpl) {
    const modal = $("#ef-editor-modal");
    modal.show();

    $("#ef-form-name").val(tpl.name);
    $("#ef-editor-modal").data("editing", JSON.parse(JSON.stringify(tpl)));

    renderFields();
    renderPreview();
  }

  // ---------------------------
  // RENDER FIELDS
  // ---------------------------
  function renderFields() {
    const modal = $("#ef-editor-modal");
    const form = modal.data("editing");
    const list = $("#ef-fields-list").empty();

    form.fields.forEach((f, index) => {
      const item = $(`
                <div class="ef-field-item">
                    <input type="text" class="ef-field-label" value="${escapeHtml(
                      f.label
                    )}">
                    <select class="ef-field-type">
                        <option value="text">text</option>
                        <option value="textarea">textarea</option>
                        <option value="email">email</option>
                        <option value="number">number</option>
                        <option value="select">select</option>
                        <option value="checkbox">checkbox</option>
                    </select>
                    <label><input type="checkbox" class="ef-field-required" ${
                      f.required ? "checked" : ""
                    }> Required</label>
                    <button class="ef-btn ef-remove">X</button>
                </div>
            `);

      item.find(".ef-field-type").val(f.type);
      item.find(".ef-field-label").on("input", function () {
        f.label = $(this).val();
        renderPreview();
      });

      item.find(".ef-field-type").on("change", function () {
        f.type = $(this).val();
        renderPreview();
      });

      item.find(".ef-field-required").on("change", function () {
        f.required = $(this).is(":checked");
        renderPreview();
      });

      item.find(".ef-remove").on("click", function () {
        form.fields.splice(index, 1);
        renderFields();
        renderPreview();
      });

      list.append(item);
    });
  }

  // ---------------------------
  // RENDER PREVIEW
  // ---------------------------
  function renderPreview() {
    const modal = $("#ef-editor-modal");
    const form = modal.data("editing");
    const preview = $("#ef-form-preview").empty();

    form.fields.forEach((f) => {
      if (f.type === "textarea") {
        preview.append(
          `<label>${f.label}</label><textarea class="ef-input"></textarea>`
        );
      } else if (f.type === "select") {
        preview.append(
          `<label>${f.label}</label><select class="ef-input"><option>Option 1</option></select>`
        );
      } else if (f.type === "checkbox") {
        preview.append(`<label><input type="checkbox"> ${f.label}</label>`);
      } else {
        preview.append(
          `<label>${f.label}</label><input class="ef-input" type="${f.type}">`
        );
      }
    });
  }

  // ---------------------------
  // BUTTON HANDLERS
  // ---------------------------
  $("#ef-open-templates").on("click", function () {
    $("#ef-templates-panel").show();
    $("#ef-saved-panel").hide();
  });

  $("#ef-close-editor").on("click", function () {
    $("#ef-editor-modal").hide();
  });

  // ---------------------------
  // INIT
  // ---------------------------
  $(document).ready(function () {
    buildTemplatesGrid();
  });
})(jQuery);
