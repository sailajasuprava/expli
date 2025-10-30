<?php
<?php
/**
 * Plugin Name: Blogify AI
 * Description: Generate AI-powered blog posts using the Gemini API after verifying your API key.
 * Version: 1.1
 * Author: Sailaja Suprava Mohanty
 * Author URI: https://sailaja-suprava-mohanty.netlify.app
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: blogify-ai
 * Domain Path: /languages
 */



session_start(); // To temporarily store user's API key

// ======== SHORTCODE ======== //
function ai_blog_generator_shortcode() {
    // STEP 1: Ask for API Key
    if (!isset($_SESSION['gemini_api_key'])) {
        if (isset($_POST['verify_api_key'])) {
            if (!isset($_POST['verify_gemini_key_nonce']) || !wp_verify_nonce($_POST['verify_gemini_key_nonce'], 'verify_gemini_key_action')) {
                return '<p style="color:red;">Security check failed. Please try again.</p>' . ai_api_key_form();
            }
            $key = sanitize_text_field(wp_unslash($_POST['gemini_key']));

            // ✅ Check if the key is valid by calling Gemini briefly
            $test_response = wp_remote_post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $key,
                [
                    'headers' => ['Content-Type' => 'application/json'],
                    'body'    => json_encode(['contents' => [[ 'parts' => [['text' => 'test']]]]]),
                    'timeout' => 10
                ]
            );

            if (!is_wp_error($test_response) && wp_remote_retrieve_response_code($test_response) === 200) {
                $_SESSION['gemini_api_key'] = $key;
                echo "<meta http-equiv='refresh' content='0'>";
                return;
            } else {
                return '<p style="color:red;">Invalid API key. Please try again.</p>' . ai_api_key_form();
            }
        }

        // Show API Key Form
        return ai_api_key_form();
    }

    // STEP 2: Blog Generator Form
    return ai_blog_form();
}
add_shortcode('ai_blog', 'ai_blog_generator_shortcode');

// ======== API KEY INPUT FORM ======== //
function ai_api_key_form() {
    return '
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
        
        .ai-key-container {
            max-width: 520px;
            margin: 60px auto;
            background: linear-gradient(135deg, #2abfff 0%, #0071ff 100%);
            border-radius: 20px;
            padding: 2px;
            box-shadow: 0 20px 60px rgba(0, 113, 255, 0.4);
            animation: fadeIn 0.6s ease-out;
        }
        
        .ai-key-inner {
            background: #ffffff;
            border-radius: 18px;
            padding: 50px 40px;
            text-align: center;
        }
        
        .ai-key-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        
        .ai-key-title {
            font-family: "Inter", sans-serif;
            font-size: 28px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 12px;
        }
        
        .ai-key-subtitle {
            font-family: "Inter", sans-serif;
            color: #718096;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 35px;
        }
        
        .ai-key-input {
            padding: 16px 20px;
            width: 100%;
            box-sizing: border-box;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 15px;
            font-family: "Inter", sans-serif;
            outline: none;
            transition: all 0.3s ease;
            background: #f7fafc;
            margin-bottom: 25px;
        }
        
        .ai-key-input:focus {
            border-color: #0071ff;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(0, 113, 255, 0.1);
        }
        
        .ai-key-button {
            padding: 16px 40px;
            background: linear-gradient(135deg, #2abfff 0%, #0071ff 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            font-family: "Inter", sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 113, 255, 0.4);
        }
        
        .ai-key-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(0, 113, 255, 0.5);
        }
        
        .ai-key-button:active {
            transform: translateY(0);
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes bounce {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }
    </style>
    
    <div class="ai-key-container">
        <div class="ai-key-inner">
            <h2 class="ai-key-title">Enter Your Gemini API Key</h2>
            <p class="ai-key-subtitle">Securely connect your Gemini API to unlock AI-powered blog generation</p>
           <form method="post">
                <?php wp_nonce_field('verify_gemini_key_action', 'verify_gemini_key_nonce'); ?>
                <input type="password" name="gemini_key" class="ai-key-input" placeholder="Paste your API key here..." required />
                <button type="submit" name="verify_api_key" class="ai-key-button">
                    Verify & Continue →
                </button>
            </form>
        </div>
    </div>';
}


// ======== BLOG PROMPT FORM ======== //
function ai_blog_form() { 
    $output = '
 <style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
    @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap");

    .ai-blog-container {
        max-width: 850px;
        margin: 60px auto;
        font-family: "Inter", sans-serif;
        animation: fadeIn 0.6s ease-out;
    }

    .ai-blog-header {
        text-align: center;
        margin-bottom: 40px;
    }

    .ai-blog-title {
        font-size: 38px;
        font-weight: 700;
        font-family: "Playfair Display", serif;
        background: linear-gradient(135deg, #0071ff, #00b4ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 12px;
    }

    .ai-blog-subtitle {
        color: #5a6f82;
        font-size: 16px;
        line-height: 1.6;
    }

    .ai-blog-card {
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        padding: 45px;
        margin-bottom: 25px;
    }

  /* Enhanced inline form */
    .ai-blog-form-wrapper {
        display: flex;
        gap: 12px;
        align-items: stretch;
        background: linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 100%);
        padding: 10px;
        border-radius: 18px;
        box-shadow: 0 4px 20px rgba(0, 113, 255, 0.15);
        transition: all 0.3s ease;
    }

    .ai-blog-form-wrapper:focus-within {
        box-shadow: 0 6px 30px rgba(0, 113, 255, 0.25);
        background: linear-gradient(135deg, #e8f4ff 0%, #d9edff 100%);
    }

    .ai-blog-input {
        flex: 1;
        padding: 18px 24px;
        border: 2px solid transparent;
        border-radius: 12px;
        font-size: 16px;
        outline: none;
        transition: all 0.3s ease;
        background: #ffffff;
        font-family: "Inter", sans-serif;
        color: #1e3a5f;
    }

    .ai-blog-input:focus {
        border-color: #0071ff;
        box-shadow: 0 0 0 3px rgba(42, 191, 255, 0.15);
    }

    .ai-blog-input::placeholder {
        color: #94a3b8;
    }

    .ai-blog-button {
        padding: 18px 40px;
        background: linear-gradient(135deg, #2abfff 0%, #0071ff 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 113, 255, 0.4);
        white-space: nowrap;
        font-family: "Inter", sans-serif;
    }

    .ai-blog-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(0, 113, 255, 0.6);
        background: linear-gradient(135deg, #1aafef 0%, #0061ef 100%);
    }

    .ai-blog-button:active {
        transform: translateY(0);
    }

    .ai-blog-logout {
        padding: 12px 30px;
        background: linear-gradient(135deg, #ff5f5f 0%, #e60000 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 15px;
        font-family: "Inter", sans-serif;
    }

    .ai-blog-logout:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(255, 95, 95, 0.4);
    }

    .ai-blog-result {
        margin-top: 40px;
    }

    .ai-blog-result-header {
        font-size: 22px;
        font-weight: 600;
        color: #1e3a5f;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    /* Blog content formatting */
    .ai-blog-result-content {
        background: linear-gradient(135deg, #f9fbff 0%, #edf6ff 100%);
        border: 1.8px solid #cfe4ff;
        border-radius: 18px;
        padding: 40px 45px;
        line-height: 1.9;
        color: #1e3a5f;
        font-size: 17px;
        box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .ai-blog-result-content h1,
    .ai-blog-result-content h2,
    .ai-blog-result-content h3 {
        font-family: "Playfair Display", serif;
        color: #003c99;
        margin: 30px 0 15px 0;
    }

    .ai-blog-result-content h1 {
        font-size: 30px;
        border-bottom: 2px solid #0071ff;
        padding-bottom: 6px;
    }

    .ai-blog-result-content h2 {
        font-size: 24px;
        font-weight: bold;
        color: #0052cc;
        border-left: 4px solid #0071ff;
        padding-left: 10px;
        margin-top: 28px;
    }

    .ai-blog-result-content h3 {
        font-size: 20px;
        color: #004099;
        margin-top: 20px;
    }

    .ai-blog-result-content p {
        margin-bottom: 16px;
        text-align: justify;
    }

    .ai-blog-result-content strong {
        color: #002966;
        font-weight: 600;
    }

    .ai-blog-result-content ul {
        margin: 15px 0 20px 25px;
        list-style: disc;
    }

    .ai-blog-result-content li {
        margin-bottom: 8px;
    }

    .ai-blog-result-content blockquote {
        border-left: 4px solid #0071ff;
        padding-left: 15px;
        font-style: italic;
        color: #375a8c;
        background: #f4faff;
        margin: 20px 0;
        border-radius: 6px;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

    
    <div class="ai-blog-container">
        <div class="ai-blog-header">
            <h2 class="ai-blog-title">AI Blog Generator</h2>
            <p class="ai-blog-subtitle">Transform your ideas into compelling, SEO-optimized blog posts powered by Gemini AI</p>
        </div>
        
        <div class="ai-blog-card">';
    
 if (isset($_POST["ai_prompt"])) {
     if (!isset($_POST['ai_blog_generate_nonce']) || !wp_verify_nonce($_POST['ai_blog_generate_nonce'], 'ai_blog_generate_action')) {
        return '<p style="color:red;">Security check failed. Please reload and try again.</p>';
    }

    $prompt = sanitize_text_field(wp_unslash($_POST['ai_prompt']));
    $api_key = $_SESSION["gemini_api_key"];

    $response = wp_remote_post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $api_key,
        [
            "headers" => ["Content-Type" => "application/json"],
            "body"    => json_encode([
                "contents" => [[
                    "parts" => [["text" => "Write a detailed blog post about: $prompt. Include headings, intro, and conclusion. Use Markdown syntax for formatting."]]
                ]],
            ]),
            "timeout" => 25,
        ]
    );

    if (is_wp_error($response)) {
        $output .= "<p style='color:#e60000; font-weight:500;'>⚠️ Error: " . esc_html($response->get_error_message()) . "</p>";
    } else {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        $text = $data["candidates"][0]["content"]["parts"][0]["text"] ?? "No response received.";

        // --- 🪄 Markdown Formatting Conversion --- //
        $formatted = $text;

        // Headings
        $formatted = preg_replace('/^### (.*?)$/m', '<h3>$1</h3>', $formatted);
        $formatted = preg_replace('/^## (.*?)$/m', '<h2>$1</h2>', $formatted);
        $formatted = preg_replace('/^# (.*?)$/m', '<h1>$1</h1>', $formatted);

        // Bold and Italic
        $formatted = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $formatted);
        $formatted = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $formatted);

        // Lists
        $formatted = preg_replace('/\n\* (.*?)(?=\n|$)/', '<li>$1</li>', $formatted);
        $formatted = preg_replace('/(<li>.*<\/li>)/s', '<ul>$1</ul>', $formatted);

        // Paragraphs
        $formatted = preg_replace('/\n{2,}/', "</p><p>", $formatted);
        $formatted = '<p>' . $formatted . '</p>';

        // Line breaks
        $formatted = nl2br($formatted);

        // --- ✅ Display the output inside styled container --- //
        $output .= "
        <div class='ai-blog-result'>
            <h3 class='ai-blog-result-header'>
                Your Generated Blog Post
            </h3>
            <div class='ai-blog-result-content'>
                $formatted
            </div>
        </div>";
    }
}

    
    // Blog input form
     $output .= '
            <form method="post">
                <?php wp_nonce_field('ai_blog_generate_action', 'ai_blog_generate_nonce'); ?>
                <div class="ai-blog-form-wrapper">
                    <input type="text" name="ai_prompt" class="ai-blog-input" placeholder="Enter your blog topic..." required />
                    <button type="submit" class="ai-blog-button">
                        Generate Blog
                    </button>
                </div>
            </form>

        </div>

        <form method="post" class="ai-blog-center">
            <button type="submit" name="logout_key" class="ai-blog-logout">
                Change API Key
            </button>
        </form>
    </div>';

    if (isset($_POST['logout_key'])) {
        unset($_SESSION['gemini_api_key']);
        echo "<meta http-equiv='refresh' content='0'>";
    }

    return $output;
}
