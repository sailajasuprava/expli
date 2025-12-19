(function ($) {
  "use strict";

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // safe getter for localized data
  function getData() {
    return window.FormCraftedData || {};
  }

  // ---------------------------
  // BUILD TEMPLATES GRID
  // ---------------------------
  function buildTemplatesGrid() {
    var data = getData();
    var templates = Array.isArray(data.templates) ? data.templates : [];
    var $panel = $("#fc-templates-panel").empty();

    if (!templates.length) {
      $panel.append(
        $("<div>")
          .css({ padding: 20, color: "#666", textAlign: "center" })
          .text("No templates available.")
      );
      return;
    }

    templates.forEach(function (tpl) {
      var $card = $('<div class="fc-template-card"></div>');
      var $thumb;
      if (tpl && tpl.thumbnail) {
        $thumb = $('<img class="fc-template-thumb" />')
          .attr("src", tpl.thumbnail)
          .attr("alt", tpl.name || "");
      } else {
        $thumb = $('<div class="fc-template-thumb"></div>');
      }
      var $name = $('<div class="fc-template-name"></div>').text(
        tpl.name || "Template"
      );
      var $btn = $('<button class="fc-btn fc-btn-primary">Use</button>');
      $btn.on("click", function () {
        openEditor(tpl);
      });

      $card.append($thumb).append($name).append($btn);
      $panel.append($card);
    });
  }

  // ---------------------------
  // OPEN EDITOR
  // ---------------------------
  function openEditor(tpl) {
    var $modal = $("#fc-editor-modal");
    // Normalize tpl (may be template object or already-saved form)
    var formObj = tpl
      ? JSON.parse(JSON.stringify(tpl))
      : { id: uid("form"), name: "Custom Form", fields: [] };
    formObj.id = formObj.id || uid("form");
    formObj.fields = formObj.fields || [];

    // ensure each field has an id
    formObj.fields = formObj.fields.map(function (f) {
      f = f || {};
      f.id = f.id || uid("f");
      return f;
    });

    $("#fc-editor-title").text("Edit — " + (formObj.name || "Untitled"));
    $("#fc-form-name").val(formObj.name || "");
    $modal.data("editing", formObj);
    $modal.show();

    renderFields();
    renderPreview();
    // focus first label input
    setTimeout(function () {
      $("#fc-fields-list").find(".fc-field-label-input").first().focus();
    }, 180);
  }

  // ---------------------------
  // RENDER FIELDS LIST (left)
  // ---------------------------
  function renderFields() {
    var $list = $("#fc-fields-list").empty();
    var editing = $("#fc-editor-modal").data("editing") || { fields: [] };
    var fields = editing.fields || [];

    if (!fields.length) {
      $list.append(
        $(
          '<div style="padding:12px;color:#666;text-align:center;">No fields. Add one below.</div>'
        )
      );
      return;
    }

    fields.forEach(function (f, idx) {
      var $item = $('<div class="fc-field-item"></div>');
      var $meta = $('<div class="fc-meta"></div>');

      // label input
      var $label = $(
        '<input class="fc-field-label-input" type="text" placeholder="Field label">'
      ).val(f.label || "");
      $label.on("input", function () {
        f.label = $(this).val();
        renderPreview();
      });

      // type select
      var $type = $(
        '<select class="fc-field-type-select">' +
          '<option value="text">text</option>' +
          '<option value="textarea">textarea</option>' +
          '<option value="email">email</option>' +
          '<option value="number">number</option>' +
          '<option value="select">select</option>' +
          '<option value="checkbox">checkbox</option>' +
          "</select>"
      );
      $type.val(f.type || "text");
      $type.on("change", function () {
        f.type = $(this).val();
        renderFields(); // re-render so select-options UI updates
        renderPreview();
      });

      // required checkbox
      var $reqLabel = $(
        '<label style="margin-left:6px; white-space:nowrap;"></label>'
      );
      var $req = $('<input type="checkbox" class="fc-field-required">').prop(
        "checked",
        !!f.required
      );
      $req.on("change", function () {
        f.required = $(this).is(":checked");
        renderPreview();
      });
      $reqLabel.append($req).append(" required");

      // remove button
      var $remove = $(
        '<button class="fc-btn" style="background:#ffdddd">Remove</button>'
      );
      $remove.on("click", function () {
        var editing = $("#fc-editor-modal").data("editing") || { fields: [] };
        editing.fields = editing.fields || [];
        editing.fields.splice(idx, 1);
        $("#fc-editor-modal").data("editing", editing);
        renderFields();
        renderPreview();
      });

      $meta
        .append($label)
        .append('<div style="height:8px"></div>')
        .append($type);
      $item.append($meta).append($reqLabel).append($remove);

      // if select type, show options area
      if (f.type === "select") {
        var opts = Array.isArray(f.options) ? f.options.slice() : [];
        var $optWrap = $(
          '<div style="width:100%;margin-top:8px;display:flex;flex-direction:column;gap:6px;"></div>'
        );
        opts.forEach(function (o, oi) {
          var $row = $(
            '<div style="display:flex;gap:6px;align-items:flex-start;"></div>'
          );
          var $inp = $('<input type="text" class="fc-field-option">').val(o);
          $inp.on("input", function () {
            opts[oi] = $(this).val();
            f.options = opts;
            renderPreview();
          });
          var $del = $(
            '<button class="fc-btn" style="background:#ffdede;padding:6px 8px;">x</button>'
          );
          $del.on("click", function () {
            opts.splice(oi, 1);
            f.options = opts;
            renderFields();
            renderPreview();
          });
          $row.append($inp).append($del);
          $optWrap.append($row);
        });
        var $addOpt = $(
          '<button class="fc-btn" style="margin-top:6px;">Add option</button>'
        );
        $addOpt.on("click", function () {
          opts.push("Option " + (opts.length + 1));
          f.options = opts;
          renderFields();
          renderPreview();
        });
        $item.append($optWrap).append($addOpt);
      }

      $list.append($item);
    });
  }

  // ---------------------------
  // RENDER PREVIEW (right)
  // ---------------------------
  function renderPreview() {
    var $preview = $("#fc-form-preview").empty();
    var editing = $("#fc-editor-modal").data("editing") || { fields: [] };
    var fields = editing.fields || [];

    if (!fields.length) {
      $preview.append(
        $(
          '<div style="padding:12px;color:#666;text-align:center;">Form preview will appear here.</div>'
        )
      );
      return;
    }

    var $form = $('<form class="fc-live-form"></form>');

    fields.forEach(function (f) {
      var reqStar = f.required ? ' <span style="color:red">*</span>' : "";
      var labelText = escapeHtml(f.label || "");
      var $row = $('<div style="margin-bottom:10px;"></div>');

      if (f.type === "textarea") {
        var $lbl = $(
          '<label style="font-weight:600; font-size:14px; display:block;"></label>'
        ).html(labelText + reqStar);
        var $ta = $('<textarea class="fc-input" rows="3"></textarea>').attr(
          "name",
          f.id || uid("f")
        );
        $row.append($lbl).append($ta);
      } else if (f.type === "select") {
        var $lbl = $(
          '<label style="font-weight:600; font-size:14px; display:block;"></label>'
        ).html(labelText + reqStar);
        var $sel = $('<select class="fc-input"></select>').attr(
          "name",
          f.id || uid("f")
        );
        var opts =
          Array.isArray(f.options) && f.options.length
            ? f.options
            : ["Option 1", "Option 2"];
        opts.forEach(function (o) {
          $sel.append($("<option></option>").text(o));
        });
        $row.append($lbl).append($sel);
      } else if (f.type === "checkbox") {
        var $chk = $("<label></label>");
        var $input = $('<input type="checkbox">').attr(
          "name",
          f.id || uid("f")
        );
        $chk.append($input).append(" " + labelText + reqStar);
        $row.append($chk);
      } else {
        var $lbl = $(
          '<label style="font-weight:600; font-size:14px; display:block;"></label>'
        ).html(labelText + reqStar);
        var $in = $('<input class="fc-input">')
          .attr("type", f.type || "text")
          .attr("name", f.id || uid("f"));
        $row.append($lbl).append($in);
      }

      $form.append($row);
    });

    var $submit = $(
      '<button class="fc-btn fc-btn-primary">Submit (demo)</button>'
    );
    $submit.on("click", function (e) {
      e.preventDefault();
      var d = {};
      $form.serializeArray().forEach(function (p) {
        d[p.name] = p.value;
      });

      var data = getData();
      $.post(data.ajax_url || "/wp-admin/admin-ajax.php", {
        action: "formcrafted_submit_form",
        nonce: data.nonce,
        form_id: editing.id || "",
        data: JSON.stringify(d),
      })
        .done(function (resp) {
          if (resp && resp.success) {
            alert("Submission saved (demo)");
          } else {
            alert("Submission failed");
          }
        })
        .fail(function () {
          alert("Submission failed");
        });
    });

    $preview.append($form).append($submit);
  }

  // ---------------------------
  // Publish (insert) - used when user clicks Insert & Publish
  // ---------------------------
  function renderPublishedForm(formObj) {
    var $area = $("#fc-published-area").empty();
    if (!formObj || !Array.isArray(formObj.fields)) {
      $area.append($("<div>").text("Nothing to publish."));
      return;
    }

    var $wrap = $('<div class="fc-published"></div>');
    $wrap.append($("<h3>").text(formObj.name || "Form"));

    var $f = $("<form></form>");
    formObj.fields.forEach(function (ff) {
      var reqStar = ff.required ? ' <span style="color:red">*</span>' : "";
      var labelText = escapeHtml(ff.label || "");
      var $row = $("<div style='margin-bottom:10px;'></div>");

      if (ff.type === "textarea") {
        $row.append($("<label>").html(labelText + reqStar));
        $row.append(
          $('<textarea class="fc-input"></textarea>').attr(
            "name",
            ff.id || uid("f")
          )
        );
      } else if (ff.type === "select") {
        var $sel = $('<select class="fc-input"></select>').attr(
          "name",
          ff.id || uid("f")
        );
        var opts = Array.isArray(ff.options) ? ff.options : [];
        if (!opts.length) opts = ["Option 1", "Option 2"];
        opts.forEach(function (o) {
          $sel.append($("<option>").text(o));
        });
        $row.append($("<label>").html(labelText + reqStar)).append($sel);
      } else if (ff.type === "checkbox") {
        $row.append(
          $("<label>")
            .append(
              $('<input type="checkbox">').attr("name", ff.id || uid("f"))
            )
            .append(" " + labelText + reqStar)
        );
      } else {
        $row.append($("<label>").html(labelText + reqStar));
        $row.append(
          $('<input class="fc-input">')
            .attr("type", ff.type || "text")
            .attr("name", ff.id || uid("f"))
        );
      }

      $f.append($row);
    });

    var $btn = $('<button class="fc-btn fc-btn-primary">Submit</button>');
    $btn.on("click", function (e) {
      e.preventDefault();
      var d = {};
      $f.serializeArray().forEach(function (p) {
        d[p.name] = p.value;
      });
      var data = getData();
      $.post(data.ajax_url || "/wp-admin/admin-ajax.php", {
        action: "formcrafted_submit_form",
        nonce: data.nonce,
        form_id: formObj.id || uid("form"),
        data: JSON.stringify(d),
      }).done(function (resp) {
        if (resp && resp.success) {
          alert("Submission received");
          $f[0].reset();
        }
      });
    });

    $wrap.append($f).append($btn);
    $area.append($wrap);
  }

  // ---------------------------
  // Event bindings
  // ---------------------------
  $(document).on("click", "#fc-open-templates", function () {
    $("#fc-templates-panel").show();
    $("#fc-saved-panel").hide();
    buildTemplatesGrid();
  });

  $(document).on("click", "#fc-open-saved", function () {
    $("#fc-templates-panel").hide();
    $("#fc-saved-panel").show();
    buildSavedGrid();
  });

  $(document).on("click", "#fc-close-editor", function () {
    $("#fc-editor-modal").hide();
  });

  // Add field button (left panel)
  $(document).on("click", "#fc-add-field", function () {
    var type = $("#fc-new-type").val() || "text";
    var editing = $("#fc-editor-modal").data("editing") || { fields: [] };
    editing.fields = editing.fields || [];
    var nf = {
      id: uid("f"),
      label: type === "select" ? "Choose" : "New field",
      type: type,
      required: false,
      options: type === "select" ? ["Option 1", "Option 2"] : [],
    };
    editing.fields.push(nf);
    $("#fc-editor-modal").data("editing", editing);
    renderFields();
    renderPreview();

    // scroll to bottom and focus
    var $list = $("#fc-fields-list");
    $list.animate({ scrollTop: $list[0] ? $list[0].scrollHeight : 0 }, 220);
    setTimeout(function () {
      $list.find(".fc-field-label-input").last().focus().select();
    }, 150);
  });

  // Save form (AJAX) — this triggers the admin redirect in your PHP
  $(document).on("click", "#fc-save-custom", function () {
    var editing = $("#fc-editor-modal").data("editing") || {};
    if (!editing) return alert("Nothing to save");
    editing.name = $("#fc-form-name").val() || editing.name || "Custom Form";
    editing.id = editing.id || uid("form");
    var data = getData();
    $.post(data.ajax_url || "/wp-admin/admin-ajax.php", {
      action: "formcrafted_save_form",
      nonce: data.nonce,
      form: JSON.stringify(editing),
    })
      .done(function (resp) {
        if (resp && resp.success) {
          alert("Form saved");
          $("#fc-editor-modal").hide();
          if (data.admin_overview_url)
            window.location.href = data.admin_overview_url;
        } else {
          alert("Save failed");
        }
      })
      .fail(function () {
        alert("Save failed");
      });
  });

  // Insert & Publish
  $(document).on("click", "#fc-publish-form", function () {
    var editing = $("#fc-editor-modal").data("editing") || {};
    editing.name = $("#fc-form-name").val() || editing.name;
    renderPublishedForm(editing);
    $("#fc-editor-modal").hide();
  });

  // ---------------------------
  // Saved grid builder (admin-saved list on left)
  // ---------------------------
  function buildSavedGrid() {
    var data = getData();
    var saved = data.savedForms || {};
    var $panel = $("#fc-saved-panel").empty();
    var keys = Object.keys(saved || {});
    if (!keys.length) {
      $panel.append(
        $(
          '<div style="padding:20px;color:#666;text-align:center;">No saved forms yet. Use a template to create one.</div>'
        )
      );
      return;
    }
    keys.forEach(function (k) {
      var f = saved[k];
      var $card = $('<div class="fc-template-card"></div>');
      $card.append(
        $("<div>")
          .addClass("fc-template-name")
          .text(f.name || k)
      );
      $card.append(
        $('<div style="margin:10px 0;"><code></code></div>')
          .find("code")
          .text('[formcrafted_form id="' + k + '"]')
          .end()
      );
      var $edit = $('<button class="fc-btn">Edit</button>');
      $edit.on("click", function () {
        openEditor(f);
      });
      $card.append($edit);
      $panel.append($card);
    });
  }

  // ---------------------------
  // INIT
  // ---------------------------
  $(function () {
    buildTemplatesGrid();
    buildSavedGrid();

    // default view: show saved
    $("#fc-templates-panel").hide();
    $("#fc-saved-panel").show();
  });
})(jQuery);
