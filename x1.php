<?php
/**
 * Plugin Name: My First Plugin
 * Description: Generate a blog post using Gemini API after verifying your key.
 * Version: 1.1
 * Author: Sailaja Suprava Mohanty
 */

session_start(); // To temporarily store user's API key

// ======== SHORTCODE ======== //
function ai_blog_generator_shortcode() {
    // STEP 1: Ask for API Key
    if (!isset($_SESSION['gemini_api_key'])) {
        if (isset($_POST['verify_api_key'])) {
            $key = sanitize_text_field($_POST['gemini_key']);

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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 2px;
            box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
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
            border-color: #667eea;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .ai-key-button {
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            font-family: "Inter", sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .ai-key-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
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
        
        .ai-blog-header-icon {
            font-size: 56px;
            margin-bottom: 20px;
            display: inline-block;
            animation: float 3s ease-in-out infinite;
        }
        
        .ai-blog-title {
            font-size: 36px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 12px;
        }
        
        .ai-blog-subtitle {
            color: #718096;
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
        
        .ai-blog-input {
            padding: 18px 24px;
            width: 100%;
            box-sizing: border-box;
            border: 2px solid #e2e8f0;
            border-radius: 14px;
            font-size: 16px;
            font-family: "Inter", sans-serif;
            outline: none;
            transition: all 0.3s ease;
            background: #f7fafc;
        }
        
        .ai-blog-input:focus {
            border-color: #48bb78;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
        }
        
        .ai-blog-button {
            padding: 18px 45px;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            border: none;
            border-radius: 14px;
            font-size: 17px;
            font-weight: 600;
            font-family: "Inter", sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);
            margin-top: 25px;
        }
        
        .ai-blog-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(72, 187, 120, 0.5);
        }
        
        .ai-blog-button:active {
            transform: translateY(0);
        }
        
        .ai-blog-logout {
            padding: 12px 30px;
            background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            font-family: "Inter", sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
        }
        
        .ai-blog-logout:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(252, 129, 129, 0.4);
        }
        
        .ai-blog-result {
            margin-top: 40px;
        }
        
        .ai-blog-result-header {
            font-size: 22px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .ai-blog-result-content {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 35px;
            line-height: 1.8;
            color: #2d3748;
            font-size: 16px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        
        .ai-blog-result-content h1 {
            color: #1a202c;
            font-size: 28px;
            margin: 25px 0 15px 0;
            font-weight: 700;
        }
        
        .ai-blog-result-content h2 {
            color: #2d3748;
            font-size: 22px;
            margin: 20px 0 12px 0;
            font-weight: 600;
        }
        
        .ai-blog-result-content strong {
            color: #1a202c;
            font-weight: 600;
        }
        
        .ai-blog-center {
            text-align: center;
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
        
        @keyframes float {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-15px);
            }
        }
    </style>
    
    <div class="ai-blog-container">
        <div class="ai-blog-header">
            <h2 class="ai-blog-title">AI Blog Generator</h2>
            <p class="ai-blog-subtitle">Transform your ideas into compelling, SEO-optimized blog posts powered by Gemini AI</p>
        </div>
        
        <div class="ai-blog-card">';

    if (isset($_POST['ai_prompt'])) {
        $prompt = sanitize_text_field($_POST['ai_prompt']);
        $api_key = $_SESSION['gemini_api_key'];

        $response = wp_remote_post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $api_key,
            [
                'headers' => ['Content-Type' => 'application/json'],
                'body'    => json_encode([
                    'contents' => [[
                        'parts' => [['text' => "Write a detailed blog post about: $prompt. Include headings, intro, and conclusion."]]
                    ]],
                ]),
                'timeout' => 25,
            ]
        );

        if (is_wp_error($response)) {
            $output .= '<p style="color:#f56565; font-weight: 500;">⚠️ Error: ' . esc_html($response->get_error_message()) . '</p>';
        } else {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response received.';

            // Markdown formatting
            $formatted = nl2br($text);
            $formatted = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $formatted);
            $formatted = preg_replace('/## (.*?)<br>/', '<h2>$1</h2>', $formatted);
            $formatted = preg_replace('/# (.*?)<br>/', '<h1>$1</h1>', $formatted);

            $output .= '
            <div class="ai-blog-result">
                <h3 class="ai-blog-result-header">
                    <span>🎯</span> Your Generated Blog Post
                </h3>
                <div class="ai-blog-result-content">
                    ' . $formatted . '
                </div>
            </div>';
        }
    }

    // Blog input form
    $output .= '
            <form method="post" class="ai-blog-center">
                <input type="text" name="ai_prompt" class="ai-blog-input" placeholder="Enter your blog topic (e.g., Benefits of AI in Healthcare)..." required />
                <button type="submit" class="ai-blog-button">
                    ✨ Generate Blog Post
                </button>
            </form>
        </div>

        <form method="post" class="ai-blog-center">
            <button type="submit" name="logout_key" class="ai-blog-logout">
                🔄 Change API Key
            </button>
        </form>
    </div>';

    if (isset($_POST['logout_key'])) {
        unset($_SESSION['gemini_api_key']);
        echo "<meta http-equiv='refresh' content='0'>";
    }

    return $output;
}