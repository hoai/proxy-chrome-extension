var Proxy = function () {

    var storedData = {};

    var config = function () {
        console.log("!!: " + JSON.stringify(storedData))
        return {
            mode: "fixed_servers",
            rules: {
                proxyForHttp: {
                    host: storedData.proxyAddress.split(":")[0],
                    port: parseInt(storedData.proxyAddress.split(":")[1])
                },
                proxyForHttps: {
                    host: storedData.proxyAddress.split(":")[0],
                    port: parseInt(storedData.proxyAddress.split(":")[1])
                },
                bypassList: ["localhost,127.0.0.1"]
            }
        }
    };

    var credentialsToHeader = function (status) {
        for (var header in status.requestHeaders) {
            if (header.name == 'Authorization') {
                return {};
            }
        }

        status.requestHeaders.push({
            name: 'Authorization',
            value: 'Basic ' + btoa(storedData.proxyUsername + ':' + storedData.proxyPassword)
        });

        console.log("test: " + JSON.stringify(storedData));
        console.log("test1: " + JSON.stringify(status.requestHeaders));

        return {requestHeaders: status.requestHeaders};
    };

    var authCredentials = function (status) {
        return {
            authCredentials: {
                username: storedData.proxyUsername,
                password: storedData.proxyPassword
            }
        }
    }

    var setProxy = function () {
        if (storedData.proxyAddress != '') {
            chrome.proxy.settings.set(
                {value: config(), scope: 'regular'},
                function () {
                    if (storedData.proxyAddress != "" || storedData.proxyUsername != "") {
                        if (chrome.webRequest.onAuthRequired) {
                            chrome.webRequest.onAuthRequired.addListener(authCredentials, {urls: ['<all_urls>']}, ['blocking']);
                        } else {
                            // chrome.webRequest.onBeforeSendHeaders.removeListener(credentialsToHeader)
                            chrome.webRequest.onBeforeSendHeaders.addListener(credentialsToHeader, {urls: ['<all_urls>']}, ['blocking', 'requestHeaders']);
                        }
                    }
                }
            );
        }
    };

    var init = function () {
        setProxy();

        chrome.storage.onChanged.addListener(function (changes, namespace) {
            // for (k in changes)
            chrome.storage.sync.get(
                null,
                function (items) {
                    storedData = items
                    console.log("test2: " + storedData.proxyAddress)
                    setProxy();
                }
            );
        });

        chrome.proxy.settings.get(
            {'incognito': false},
            function (config) {
                console.log(JSON.stringify(config));
            }
        );
    };

    this.run = function () {
        chrome.storage.sync.get(
            null,
            function (items) {
                console.log("Items stored: " + JSON.stringify(items))
                storedData = items
                init();
            }
        );
    };
};

new Proxy().run();
