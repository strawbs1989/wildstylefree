// =====================================================
// WILDSTYLE SPAM & CONTENT FILTER
// =====================================================

"use strict";

(function () {

    console.log("🔥 SPAM FILTER LOADED");

    // =================================================
    // CONFIGURATION
    // =================================================

    const FILTER_CONFIG = {
        // Repeated characters threshold (e.g., "aaaaaaa")
        repeatedCharThreshold: 5,

        // Excessive caps threshold (% of message that's caps)
        capsThreshold: 70,

        // Maximum links allowed per message
        maxLinksPerMessage: 1,

        // Banned domains (add more as needed)
        bannedDomains: [
            "bit.ly",
            "tinyurl.com",
            "goo.gl",
            "click4.me",
            "adf.ly",
            "youtu.be", // ambiguous shortened URL
            "tiktok.com",
            "discord.gg", // unless whitelisted
            "cashapp",
            "venmo",
            "crypto",
            "bitcoin",
            "eth",
            "forex",
            "casino",
            "poker",
            "xxx"
        ],

        // Whitelisted domains (safe links)
        whitelistedDomains: [
            "youtube.com",
            "spotify.com",
            "soundcloud.com",
            "twitter.com",
            "instagram.com",
            "tiktok.com"
        ],

        // Spam trigger words and patterns
        spamKeywords: [
            "click here",
            "buy now",
            "limited time",
            "act now",
            "free money",
            "earn fast",
            "make money",
            "guaranteed",
            "no credit check",
            "instant approval",
            "work from home",
            "get rich",
            "nigerian prince", // common scam
            "wire transfer",
            "paypal verified",
            "dm for details",
            "inbox me",
            "check pinned",
            "see description",
            "link in bio",
            "swipe up",
            "follow for follow",
            "follow back",
            "free gift",
            "claim reward",
            "verify account",
            "confirm identity",
            "update payment",
            "adult content",
            "xxx",
            "nude",
            "nsfw"
        ],

        // Emojis/characters that often indicate spam (repeated)
        spamEmojis: ["🔥", "💰", "🎁", "👑", "✨", "🚀", "💎", "⚡"]
    };

    // =================================================
    // CHECK REPEATED CHARACTERS
    // =================================================

    function hasExcessiveRepeats(message) {
        // Check for 5+ repeated characters in a row
        const repeats = /(.)\1{4,}/g;
        return repeats.test(message);
    }

    // =================================================
    // CHECK EXCESSIVE CAPS
    // =================================================

    function hasExcessiveCaps(message) {
        // Remove URLs and spaces from calculation
        const textOnly = message
            .replace(/http[s]?:\/\/\S+/g, "")
            .replace(/\s/g, "");

        if (textOnly.length < 5) return false; // Don't flag short messages

        const capsCount = (textOnly.match(/[A-Z]/g) || []).length;
        const capsPercent = (capsCount / textOnly.length) * 100;

        return capsPercent > FILTER_CONFIG.capsThreshold;
    }

    // =================================================
    // CHECK LINKS
    // =================================================

    function checkLinks(message) {
        const urlRegex = /http[s]?:\/\/(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)/gi;
        const links = message.match(urlRegex) || [];

        // Too many links
        if (links.length > FILTER_CONFIG.maxLinksPerMessage) {
            return {
                isSpam: true,
                reason: `Too many links (max ${FILTER_CONFIG.maxLinksPerMessage})`
            };
        }

        // Check for banned domains
        for (const link of links) {
            const url = new URL(link);
            const domain = url.hostname.toLowerCase();

            // Check if whitelisted
            const isWhitelisted = FILTER_CONFIG.whitelistedDomains.some(
                d => domain.includes(d)
            );

            if (isWhitelisted) continue;

            // Check if banned
            const isBanned = FILTER_CONFIG.bannedDomains.some(
                d => domain.includes(d)
            );

            if (isBanned) {
                return {
                    isSpam: true,
                    reason: `Suspicious link detected: ${domain}`
                };
            }
        }

        return { isSpam: false };
    }

    // =================================================
    // CHECK SPAM KEYWORDS
    // =================================================

    function hasSpamKeywords(message) {
        const messageLower = message.toLowerCase();
        
        for (const keyword of FILTER_CONFIG.spamKeywords) {
            if (messageLower.includes(keyword)) {
                return {
                    isSpam: true,
                    reason: `Spam keyword detected: "${keyword}"`
                };
            }
        }

        return { isSpam: false };
    }

    // =================================================
    // CHECK EMOJI SPAM
    // =================================================

    function hasExcessiveEmojis(message) {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]/gu;
        const emojis = message.match(emojiRegex) || [];

        // Flag if more than 50% emojis
        if (message.length > 5 && (emojis.length / message.length) > 0.5) {
            return {
                isSpam: true,
                reason: "Excessive emojis"
            };
        }

        // Check for spam emoji spam (repeated same emoji)
        for (const emoji of FILTER_CONFIG.spamEmojis) {
            const count = (message.match(new RegExp(emoji, "g")) || []).length;
            if (count >= 3) {
                return {
                    isSpam: true,
                    reason: `Excessive emoji spam: ${emoji}`
                };
            }
        }

        return { isSpam: false };
    }

    // =================================================
    // MAIN FILTER FUNCTION
    // =================================================

    window.filterMessage = function (message) {
        if (!message || typeof message !== "string") {
            return { isSpam: false };
        }

        const trimmed = message.trim();

        // =============================================
        // RUN ALL CHECKS
        // =============================================

        // Check 1: Repeated characters
        if (hasExcessiveRepeats(trimmed)) {
            return {
                isSpam: true,
                severity: "high",
                reason: "Excessive repeated characters"
            };
        }

        // Check 2: Excessive caps
        if (hasExcessiveCaps(trimmed)) {
            return {
                isSpam: true,
                severity: "medium",
                reason: "Excessive capitalization"
            };
        }

        // Check 3: Links
        const linkCheck = checkLinks(trimmed);
        if (linkCheck.isSpam) {
            return {
                isSpam: true,
                severity: "high",
                reason: linkCheck.reason
            };
        }

        // Check 4: Spam keywords
        const keywordCheck = hasSpamKeywords(trimmed);
        if (keywordCheck.isSpam) {
            return {
                isSpam: true,
                severity: "high",
                reason: keywordCheck.reason
            };
        }

        // Check 5: Emoji spam
        const emojiCheck = hasExcessiveEmojis(trimmed);
        if (emojiCheck.isSpam) {
            return {
                isSpam: true,
                severity: "medium",
                reason: emojiCheck.reason
            };
        }

        // =============================================
        // ALL CHECKS PASSED
        // =============================================

        return {
            isSpam: false,
            message: "Message is clean"
        };
    };

    // =================================================
    // ADD CUSTOM BANNED WORDS
    // =================================================

    window.addBannedWord = function (word) {
        if (!FILTER_CONFIG.spamKeywords.includes(word.toLowerCase())) {
            FILTER_CONFIG.spamKeywords.push(word.toLowerCase());
            console.log("✅ Added banned word:", word);
        }
    };

    // =================================================
    // ADD WHITELISTED DOMAIN
    // =================================================

    window.addWhitelistedDomain = function (domain) {
        if (!FILTER_CONFIG.whitelistedDomains.includes(domain.toLowerCase())) {
            FILTER_CONFIG.whitelistedDomains.push(domain.toLowerCase());
            console.log("✅ Added whitelisted domain:", domain);
        }
    };

    // =================================================
    // ADD BANNED DOMAIN
    // =================================================

    window.addBannedDomain = function (domain) {
        if (!FILTER_CONFIG.bannedDomains.includes(domain.toLowerCase())) {
            FILTER_CONFIG.bannedDomains.push(domain.toLowerCase());
            console.log("✅ Added banned domain:", domain);
        }
    };

    // =================================================
    // GET FILTER CONFIG (for owner panel)
    // =================================================

    window.getFilterConfig = function () {
        return FILTER_CONFIG;
    };

    console.log("✅ SPAM FILTER READY");

})();
