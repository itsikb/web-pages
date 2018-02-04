var KENSHOO_CLICK_ID_COOKIE_NAME = "ken_kclid";
var CONVERSION_KCLID_PARAM_NAME = "kclid";
var LANDING_PAGE_KCLID_PARAM_NAME = "kclid";


;var Kenshoo_Helpers = function() {

    var createCORSRequest =  function(url){
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr){
            xhr.open('GET', url, true);
        } else if (typeof XDomainRequest != "undefined"){
            xhr = new XDomainRequest();
            xhr.open('GET', url);
        } else {
            xhr = null;
        }
        return xhr;
    };

    var setKenshooDomainCookie = function(value) {
        return setDomainCookie("k_user_id", value);
    };

    var setDomainCookie = function(name, value) {
        if (!value) {
            value = createUUID();
        }
        if (!name) {
            return;
        }
        var date = new Date();
        date.setTime(date.getTime()+(31536000000)); // 1 year
        var expires = "; expires="+date.toGMTString();
        document.cookie = name+"="+value+expires+"; path=/";
        return value;
    };

    var createUUID = function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    var s4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };

    return {
        loadPixel: function(url, onloadCallback) {
            var protocol = document.location.protocol;
            if (protocol.indexOf("http") !== 0) {
                protocol = "https:";
            }
            var img = new Image(1,1);
            img.onload = onloadCallback;
            img.src = protocol + "//" + url;
            return img;
        },

        getParameter: function(name, url) {
            if (!url) {
                url = window.location.href;
            }
            var index = url.indexOf('?');
            if (index == -1) {
                return null;
            }
            var params = url.substring(index+1).split("&");

            for (var i=0; i < params.length; i++) {
                var val = params[i].split("=");
                if (val[0] === name) {
                    return val[1];
                }
            }
            return null;
        },

        generateUUID: function() {
            return createUUID();
        },

        getCookie: function(callback) {
            var fromParam = this.getParameter("k_user_id");
            if (fromParam) {
                return callback(fromParam);
            }

            var fromDomain = this.getDomainCookie();
            if (fromDomain) {
                return callback(fromDomain);
            }

            var xhr = createCORSRequest("https://services.xg4ken.com/kid");
            if (xhr){
                xhr.onload = function(){
                    if (xhr.status == 200) {
                        var remoteCookie = xhr.responseText;
                        setKenshooDomainCookie(remoteCookie);
                        callback(remoteCookie);
                    }
                    else if (xhr.status == 404) {
                        setKenshooDomainCookie();
                        callback(null);
                    }
                };
                xhr.onerror = function() {
                    setKenshooDomainCookie();
                    callback(null);
                };
                xhr.send();
            }
        },

        getDomainCookie: function(name) {
            if (!name) {
                name = "k_user_id";
            }
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },

        createDomainCookie: function (name, value, expiryInMillis, domain) {
            if (!name) {
                return;
            }
            if (!value) {
                value = createUUID();
            }
            if (!expiryInMillis) {
                expiryInMillis = 31536000000; //Default is 1 year
            }
            var date = new Date();
            date.setTime(date.getTime() + (expiryInMillis));
            var expires = "; expires=" + date.toGMTString();
            var domainStr = "";
            if (domain != null)
            {
                domainStr = "; domain=" + domain;
            }
            document.cookie = name + "=" + value + expires + domainStr + "; path=/";
            return value;
        },

        createRandomDomainCookie: function (name, expiryInMillis) {
            return this.createDomainCookie(name, "", expiryInMillis);
        },

        paramsToString: function(params, pathSeparator, keyPrefix) {
            var prefix = (!keyPrefix) ? '' : keyPrefix;
            var res = "";
            if (params !== null) {
                for (var key in params) {
                    if (res !== "") {
                        res += '&';
                    }
                    res += prefix + key + '=' + params[key];
                }
                if (res !== "") {
                    res = pathSeparator + res;
                }
            }
            return res;
        },

        isEmptyString: function(param) {
            if (param === undefined || param === null) {
                return true;
            }
            if (Kenshoo_Helpers.isString(param)) {
                return Kenshoo_Helpers.trim(param) === "";
            }
            if (Kenshoo_Helpers.isNumber(param)) {
                return false;
            }
            return true;
        },

        isNumber: function(param) {
            return typeof(param) === "number";
        },

        isString: function(param) {
            return typeof(param) === "string";
        },

        trim: function(str) {
            return str.replace(/^\s+|\s+$/g,"");
        },

        findGroupForCookie:  function(ratio, experiment) {
            if (!experiment) {
                experiment = "";
            }
            var uid = this.getDomainCookie("k_rlsa");
            if (!uid) {
                uid = setDomainCookie("k_rlsa");
            }
            uid += "_"+experiment;

            //convert the cookie id string into a string by summing up its cahracter values
            var val = 0;
            for (var i = 0 ; i < uid.length ; i++) {
                val += uid.charCodeAt(i);
            }
            val = Math.abs(val);

            //calculate which group the cookie should fall into
            if (!ratio) {
                ratio = [1, 1];
            }
            var sum = 0;
            for (i = 0; i < ratio.length; i++) {
                sum += 1*ratio[i];
            }
            var mod = val % sum;

            var groupSum = 0;
            for (i = 0; i < ratio.length; i++) {
                groupSum += ratio[i];
                if (mod < groupSum) {
                    var group = String.fromCharCode(97 + i);
                    return group;
                }
            }

            return null;
        },

        getDomain: function() {
            return window.location.host;
        },

        getRandomNumber: function (minValue, maxValue) {
            return Math.floor(Math.random() * (maxValue + 1) + minValue);
        },
        makeCORSRequest :  function(url, callback){
            var xhr = new XMLHttpRequest();
            if ("withCredentials" in xhr){
                xhr.open('GET', url, true);
                xhr.withCredentials = true;
            } else if (typeof XDomainRequest != "undefined"){
                xhr = new XDomainRequest();
                xhr.open('GET', url);
            } else {
                xhr = null;
            }

            if (xhr){
                xhr.onload = function(){
                    if (xhr.status == 200) {
                        callback(xhr.responseText);
                    }
                    else if (xhr.status == 404) {
                        callback(null);
                    }
                };
                xhr.onerror = function() {
                    callback(null);
                };

                xhr.send();
            }
        },

        isValidUUID : function(str) {
            var regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return regexUUID.test(str);
        },

        //Code taken from https://stackoverflow.com/questions/8253136/how-to-get-domain-name-only-using-javascript with a small modification to support kenshooprd.local
        //Supported domains are limited but not dramatic. Performance is good (~48K/sec).
        //Performance tests: https://jsperf.com/cookie-tld
        getSecondLevelDomain : function(domain) {
            if (!domain) {
                return null;
            }
            // http://data.iana.org/TLD/tlds-alpha-by-domain.txt
            var TLDs = ["ac", "ad", "ae", "aero", "af", "ag", "ai", "al", "am", "an", "ao", "aq", "ar",
                "arpa", "as", "asia", "at", "au", "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg",
                "bh", "bi", "biz", "bj", "bm", "bn", "bo", "br", "bs", "bt", "bv", "bw", "by", "bz", "ca",
                "cat", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "com", "coop",
                "cr", "cu", "cv", "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec", "edu", "ee",
                "eg", "er", "es", "et", "eu", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb", "gd", "ge",
                "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gov", "gp", "gq", "gr", "gs", "gt", "gu", "gw",
                "gy", "hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "info", "int", "io",
                "iq", "ir", "is", "it", "je", "jm", "jo", "jobs", "jp", "ke", "kg", "kh", "ki", "km", "kn",
                "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv",
                "ly", "ma", "mc", "md", "me", "mg", "mh", "mil", "mk", "ml", "mm", "mn", "mo", "mobi", "mp",
                "mq", "mr", "ms", "mt", "mu", "museum", "mv", "mw", "mx", "my", "mz", "na", "name", "nc",
                "ne", "net", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "org", "pa", "pe",
                "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "pro", "ps", "pt", "pw", "py", "qa", "re",
                "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl",
                "sm", "sn", "so", "sr", "st", "su", "sv", "sy", "sz", "tc", "td", "tel", "tf", "tg", "th",
                "tj", "tk", "tl", "tm", "tn", "to", "tp", "tr", "travel", "tt", "tv", "tw", "tz", "ua", "ug",
                "uk", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "xn--0zwm56d",
                "xn--11b5bs3a9aj6g", "xn--3e0b707e", "xn--45brj9c", "xn--80akhbyknj4f", "xn--90a3ac", "xn--9t4b11yi5a",
                "xn--clchc0ea0b2g2a9gcd", "xn--deba0ad", "xn--fiqs8s", "xn--fiqz9s", "xn--fpcrj9c3d", "xn--fzc2c9e2c",
                "xn--g6w251d", "xn--gecrj9c", "xn--h2brj9c", "xn--hgbk6aj7f53bba", "xn--hlcj6aya9esc7a", "xn--j6w193g",
                "xn--jxalpdlp", "xn--kgbechtv", "xn--kprw13d", "xn--kpry57d", "xn--lgbbat1ad8j", "xn--mgbaam7a8h",
                "xn--mgbayh7gpa", "xn--mgbbh1a71e", "xn--mgbc0a9azcg", "xn--mgberp4a5d4ar", "xn--o3cw4h", "xn--ogbpf8fl",
                "xn--p1ai", "xn--pgbs0dh", "xn--s9brj9c", "xn--wgbh1c", "xn--wgbl6a", "xn--xkc2al3hye2a", "xn--xkc2dl3a5ee0h",
                "xn--yfro4i67o", "xn--ygbi2ammx", "xn--zckzah", "xxx", "ye", "yt", "za", "zm", "zw"].join();

            var parts = domain.split('.');
            if (parts[0] === 'www' && parts[1] !== 'com') {
                parts.shift();
            }
            var ln = parts.length;
            var i = ln;
            var minLength = parts[parts.length-1].length;
            var part;

            // iterate backwards
            while((part = parts[--i]) !== null) {
                // stop when we find a non-TLD part
                if (i === 0 || i < ln-2 || part.length < minLength  || (TLDs.indexOf(part) < 0 && i < ln-1)) {
                    //return part
                    return parts.slice(i,parts.length).join('.');
                }
            }

            return domain;
        },

        createSecondLevelDomainCookie : function (name, value, domain) {
            if (!name)
            {
                return;
            }

            if (!value)
            {
                return;
            }
            var sld = this.getSecondLevelDomain(domain);
            this.createDomainCookie(name, value, null, sld);
        }

    };

}();;var kenshoo = function () {

    var helper = Kenshoo_Helpers;

    var downloadKenshooPixel = function (subdomain, params) {
        var url = subdomain + '.xg4ken.com/media/redir.php';
        url += helper.paramsToString(params, "?");
        helper.loadPixel(url);
    };

    var downloadPixel = function (subdomain, token, params) {

        var url = subdomain + '.xg4ken.com/pixel/v1?track=1&token=' + token ;

        url += helper.paramsToString(params, "&");

        var kclidCookie = helper.getDomainCookie(KENSHOO_CLICK_ID_COOKIE_NAME);
        if (kclidCookie && helper.isValidUUID(kclidCookie)) {
            url += "&" + CONVERSION_KCLID_PARAM_NAME + "=" + kclidCookie;
        }
        helper.loadPixel(url);
    };

    var downloadRLSAPixel = function (conversionId, params) {
        var url = "googleads.g.doubleclick.net/pagead/viewthroughconversion/" + conversionId + "/?value=0&guid=ON&script=0";
        url += helper.paramsToString(params, "&", "data.");
        url += "&random=" + new Date().getTime();
        helper.loadPixel(url);
    };


    var downloadOCPMPixelWithConvTypeMapping = function (typeMappings, type, value, currency) {
        var id = typeMappings[type];
        downloadOCPMPixel(id, value, currency);
    };

    var downloadOCPMPixel = function (id, value, currency) {
        if (id) {
            var url = "www.facebook.com/tr/?ev=" + id;
            if (value) {
                url += "&cd[value]=" + value;
            }
            if (currency) {
                url += "&cd[currency]=" + currency;
            }
            url += "&noscript=1";
            helper.loadPixel(url);
        }
    };

    var trackClickIfManagedByKenshoo = function () {
        helper.getCookie(function (uid) {
            var subdomain = helper.getParameter('ken_ks');
            var profile = helper.getParameter('ken_prf');
            var affcode = helper.getParameter('ken_cid');
            if (uid && subdomain && profile && affcode) {
                downloadKenshooPixel(subdomain, {
                    k_user_id: uid,
                    prof: profile,
                    affcode: affcode,
                    url: 'http://' + subdomain + '.xg4ken.com' //empty redirect url
                });
            }
        });
    };

    return {
        /**
         * Tracks a conversion in Kenshoo
         * @param subdomain - the proxy subdomain to use for this request
         * @param token - the profile token for this request
         * @param params - a map of parameters to send with this conversion, e.g. {revenue: 1, currency: 'USD'}
         */
        trackConversion: function (subdomain, token, params) {
            downloadPixel(subdomain, token, params);
        },

        /**
         * Tracks a click in Kenshoo.
         * Click will be tracked only if the following parameters are in the URL:
         * ken_ks - the xg4ken subdomain to be used for tracking
         * ken_prf - the profile id
         * ken_cid - the affcode
         *
         * Click will tracked even if there was another click that was tracked via a redirect through xg4ken.
         */
        trackClick: function () {
            trackClickIfManagedByKenshoo();
        },

        /**
         * Fire a Google RLSA pixel with optional parameters
         * @param conversionId - The RLSA conversion id
         * @param params - an optional map of parameters to send with this conversion, e.g. {flight_destid: "SFO", flight_pagetype: "search", flight_totalvalue: 200 }
         * @see https://support.google.com/adwords/answer/3103357
         */
        trackRLSA: function (conversionId, params) {
            downloadRLSAPixel(conversionId, params);
        },

        /**
         * Fire a Google RLSA pixel with a custom parameter that identifies a user as beloging to a group that can in turned be used for A/B testing
         * @param conversionId - The RLSA conversion id
         * @param experimentId - The experiment id will be traslated into a custom parameter for RLSA which you'd be able to segment by in AdWords
         * @param ratio - An optional array of integers that set the number of groups and their sizes. For instance ratio=[1, 1] will create two groups of equal size.
         *                ratio=[1, 3] will create two groups, one with 25% of the population and the other with 75%
         *                ratio=[1, 2, 3, 4] will create 4 groups, one with 10% of the population, one with 20%, one with 30% and one with 40%
         *                More formaly, ratio=[n1, ..., nm] will create m groups, each containing nx/sum(n1..nm) of the population
         */
        trackRLSAExperiment: function (conversionId, experimentId, ratio) {
            var group = helper.findGroupForCookie(ratio, experimentId);
            if (conversionId && experimentId && group !== null) {
                downloadRLSAPixel(conversionId, {kenshoo_experiment: experimentId, kenshoo_group: group});
            }
        },

        /**
         * Fire a Facebook oCPM pixel
         * @param id - the Facebook conversion pixel id
         * @param value - The conversion value
         * @param currency - The conversion currency
         * @see https://developers.facebook.com/docs/reference/ads-api/offsite-pixels/v2.2
         */
        trackOCPM: function (id, value, currency) {
            downloadOCPMPixel(id, value, currency);
        },

        /**
         * Fire a Facebook oCPM pixel while allowing to map between Kenshoo conversion types to Facebook conversion ids
         * @param typeMappings - a mapping of Kenshoo conversion types to Facebook conversion ids, e.g. { 'sale': 1234567890, 'booking': 987654321 }
         * @param type - The Kenshoo conversion type
         * @param value - The conversion value
         * @param currency - The conversion currency
         * @see https://developers.facebook.com/docs/reference/ads-api/offsite-pixels/v2.2
         */
        trackOCPMWithConversionTypeMapping: function (typeMappings, type, value, currency) {
            downloadOCPMPixelWithConvTypeMapping(typeMappings, type, value, currency);
        },

        /**
         * Fire a user for match and sync
         * @param uid a unique identifier representing the user.
         */
        match: function (uid) {
            Uds_Pixel.matchAndSync(uid);
        },

        /**
         * Track event in Kenshoo
         * @param eventType - e.g. landingPage
         * @param subdomain - the proxy subdomain to use for this request
         * @param token - the profile token for this request
         * @param params - a map of parameters to send with this event
         */
        trackEvent: function (eventType, subdomain, token, params) {

            if (!eventType) {
                return;
            }
            if (!subdomain) {
                return;
            }
            if (!token) {
                return;
            }
            if (eventType === "landingPage") {
                LP_Pixel.storeKenshooId();
            }
        }
    };

}();

;var LP_Pixel = function () {
    var helper = Kenshoo_Helpers;


    var storeKenshooId = function (paramName, cookieName) {
        var kenshooId = helper.getParameter(paramName);

        if (!kenshooId) {
            return;
        }

        if (!helper.isValidUUID(kenshooId)) {
            return;
        }

        if (!helper.getDomainCookie(cookieName)) {
            helper.createSecondLevelDomainCookie(cookieName, kenshooId, document.domain);
        }
    };


    return {
        storeKenshooId: function (paramName) {
            if (!paramName)
            {
                paramName = LANDING_PAGE_KCLID_PARAM_NAME;
            }
            storeKenshooId(paramName,KENSHOO_CLICK_ID_COOKIE_NAME);
        }
    };
}();
;var Uds_Pixel = function () {
    var helper = Kenshoo_Helpers;
    var KID_RESOURCE_URL = 'https://services.xg4ken.com/kid?client_domain='.concat(helper.getDomain());

    var matchAndSync = function (uid) {
        if (User_Match.shouldPerformMatch(uid) || User_Sync.shouldPerformSync()) {
            helper.makeCORSRequest(KID_RESOURCE_URL, function (kenshooCookie) {
                User_Match.match(uid, kenshooCookie);
                User_Sync.sync(kenshooCookie);
            });
        }
    };

    return {
        matchAndSync: function (uid) {
            matchAndSync(uid);
        }
    };
}();
;var MATCH_COOKIE_NAME = 'kenshoo_id_match';

var User_Match = function () {
    var helper = Kenshoo_Helpers;

    var udsMatchUrl = function (subDomain, kenshooCookie, uid) {
        return 'services.xg4ken.com/services/uds/match?source=' + subDomain + '&ken_id=' + kenshooCookie + '&partner_uid=' + uid + '&hmac=';
    };

    return {
        match: function (uid, kenshooCookie) {
            if (this.shouldPerformMatch(uid) &&
                ! helper.isEmptyString(kenshooCookie)) {
                var url = udsMatchUrl(helper.getDomain(), kenshooCookie, uid);

                helper.loadPixel(url, function () {
                    helper.createRandomDomainCookie(MATCH_COOKIE_NAME, 604800000); //1 week expiry
                });
            }
        },

        shouldPerformMatch: function(uid) {
            return helper.isEmptyString(helper.getDomainCookie(MATCH_COOKIE_NAME)) && !helper.isEmptyString(uid);
        }
    };
}();
;var RAND_URL_PARAM = '&_rand=';

var User_Sync = function () {
    var helper = Kenshoo_Helpers;

    //var drawbridgeConfig = {
    //    prefix: 'p.adsymptotic.com/d/px/?_pid=12330&_psign=5cb0dcdf064bbf8b209f15056b22aa54&_puuid=',
    //    syncCookieName: 'kenshoo_drawbridge_id_sync',
    //    cookieExpiry: 604800000 //1 week expiry
    //};

    var crosswiseConfig = {
        prefix: 'cw.addthis.com/t.gif?pid=50&pdid=',
        syncCookieName: 'kenshoo_crosswise_id_sync',
        cookieExpiry: 86400000 //1 day expiry
    };

    var vendors = [crosswiseConfig];

    var vendorUrl = function (prefix, kenshooCookie, randomNumber) {
        return prefix + kenshooCookie + RAND_URL_PARAM + randomNumber;
    };

    var shouldPerformSyncForVendor = function(cookieName) {
        return helper.isEmptyString(helper.getDomainCookie(cookieName));
    };

    var syncVendor = function (vendor, kenshooCookie) {
        if (shouldPerformSyncForVendor(vendor.syncCookieName)) {
            var randomNumber = helper.getRandomNumber(1, 10000);
            var url = vendorUrl(vendor.prefix, kenshooCookie, randomNumber);

            helper.loadPixel(url, function() {
                helper.createRandomDomainCookie(vendor.syncCookieName, vendor.cookieExpiry);
            });
        }
    };

    return {
        sync: function (kenshooCookie) {
            for (var i = 0; i < vendors.length; i++) {
                syncVendor(vendors[i], kenshooCookie);
            }
        },

        shouldPerformSync: function() {
            for (var i = 0; i < vendors.length; i++) {
                if (shouldPerformSyncForVendor(vendors[i].syncCookieName)) {
                    return true;
                }
            }
            return false;
        }
    };
}();
