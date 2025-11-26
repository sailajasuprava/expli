jQuery(document).ready(function ($) {
  $("#ai_generate_btn").on("click", function () {
    const prompt = $("#ai_prompt").val().trim();
    if (!prompt) {
      alert("Please enter a topic first!");
      return;
    }

    $("#ai_result").html("<em>Generating your blog... please wait ⏳</em>");

    $.post(
      sailajaData.ajaxUrl,
      {
        action: "sailaja_generate_blog",
        nonce: sailajaData.nonce,
        prompt: prompt,
      },
      function (response) {
        if (response.success) {
          $("#ai_result").html(
            "<h4>Your AI-Generated Blog:</h4><p>" + response.data + "</p>"
          );
        } else {
          $("#ai_result").html(
            "<span style='color:red;'>Error: " + response.data + "</span>"
          );
        }
      }
    );
  });
});
