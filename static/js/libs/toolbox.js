class Toolbox {
    constructor() {
        this.socket = null;
        this.opened = false;
        this.callback = [];
        this.uReqTimer = null;
        this.setCookie('Content', version, 43200);
    }


    //////// WEBSOCKETS ////////

    sOpen() {
        if (this.opened) return;
        this.opened = true;
        this.socket = io();
        this.socket.on('connect', function () {
            this.callback.forEach((n) => {
                n();
            });
            this.callback = []; // Remove last callback
        }.bind(this));
        this.socket.on('connect_error', function (err) {
            tools.req('/check');
            this.sClose();
        }.bind(this));
        this.socket.on('disconnect', function (err) {
            console.log(err)
            this.sClose();
        }.bind(this));
    }

    sClose() {
        try {
            this.socket.disconnect();
        } catch (e) { }
        this.opened = false;
    }

    sreq(event, callback, headers) {
        clearTimeout(this.uReqTimer);
        if (!session.check()) {
            this.sClose();
            return;
        }
        if (this.socket == null || this.socket.disconnected) {
            this.callback.push(function () {
                tools.sreq(event, callback, headers);
            }.bind(this));
            this.sOpen();
            return;
        }
        this.socket.emit(event, headers, function (response, status) {
            if (typeof status != "number") status = 200;
            callback(status, response);
        }.bind(this));
    }

    screq(event, callback, headers) {
        clearTimeout(this.uReqTimer);
        if (!session.check()) {
            this.sClose();
            return;
        }
        this.uReqTimer = setTimeout(function () {
            if (!session.check()) {
                this.sClose();
                return;
            }
            if (this.socket == null || this.socket.disconnected) {
                this.callback.push(function () {
                    tools.sreq(event, callback, headers);
                }.bind(this));
                this.sOpen();
                return;
            }
            session.refresh();
            this.socket.emit(event, headers, function (response, status) {
                if (typeof status != "number") status = 200;
                callback(status, response);
            }.bind(this));
        }.bind(this), 500);
    }


    //////// HTML ////////
    /**
     * Makes a request using the parameters introduced in the function
     * @param (string) url The url you will make the request to
     * @param (function) callback Function that calls back when it was successful
     * @param (Object) headers
     */
    req(url, callback, headers) {
        let req = new XMLHttpRequest();
        req.open('GET', url, true);
        if (headers !== undefined) {
            let keys = Object.keys(headers);
            for (let i = 0; i < keys.length; i++) {
                req.setRequestHeader(keys[i], headers[keys[i]]);
            }
        }
        req.responseType = 'json';
        req.onload = function () {
            if (req.status === 401) {
                tools.hideDiag();
                tools.showLogIn("Session timed out")
            }
            if (callback != undefined) callback(req.status, req.response);
        }.bind(this);
        req.send();
    }

    /**
     * Makes a controlled request using the parameters introduced
     * @param (string) url The url you will make the request to
     * @param (function) callback Function that calls back when it was successful
     * @param (Object) headers
     */
    controlledReq(url, callback, headers) {
        if (this.uReq !== undefined) {
            this.uReq.abort();
        }
        this.uReq = new XMLHttpRequest();
        this.uReq.open('GET', url, true);
        if (headers !== undefined) {
            let keys = Object.keys(headers);
            for (let i = 0; i < keys.length; i++) {
                this.uReq.setRequestHeader(keys[i], headers[keys[i]]);
            }
        }
        this.uReq.responseType = 'json';
        this.uReq.onload = function () {
            callback(this.uReq.status, this.uReq.response);
        }.bind(this);
        this.uReq.send();
    }


    //////// MODALS ////////

    showLogIn(msg) {
        clearInterval(tools.interval);
        document.getElementById("obfuscator").classList.add('is-visible');
        showDialog({
            text: session.templates.login().format(msg),
            cancelable: false,
            onLoaded: function () {
                //updateMDL();
            },
        });
        window.addEventListener('keydown', this.enter, false);
    }

    showLoading(msg) {
        var html = `<div style="text-align: center;">
        <br>
        <span class="mdl-layout-title" style="color: #757575;">Loading {}...</span>
        <p></p>
        <br>
        <div class="mdl-spinner mdl-js-spinner is-active" style=" width: 80px;height: 80px;">
        </div>
</div>
<p></p>`;
        showDialog({
            text: html.format(msg),
            cancelable: true,
            onHidden: function () {
                if (!session.check()) {
                    tools.showLogIn('Session expired', '');
                }
            },
        });
    }

    // TODO comprobar si se puede usar en algún sitio
    showFailed() {
        var html = `<div style="text-align: center;"><br>
        <button class="mdl-button mdl-js-button mdl-button--primary">
                <i class="material-icons">announcement</i> Failed to load page
        </button></center><br>
        <p></p><br>
        <img src="/img/sad.jpg" style="max-width:50%;max-height:50%;">
        <p></p><br>
        <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="location.reload();">
                <i class="material-icons">autorenew</i> Press to retry
        </button>
        <p></p><br>
</div>`;
        showDialog({
            text: html,
            cancelable: false
        });
    }

    hideDiag() {
        try {
            document.getElementById("orrsDiag").remove();
        } catch (e) {
            console.log(e);
        }
    }

    snack(msg) {
        (function () {
            'use strict';
            var snackbarContainer = document.querySelector('#demo-toast-example');
            setTimeout(function () {
                snackbarContainer.MaterialSnackbar.showSnackbar({ message: msg });
            }, 500);
        }())
    }


    //////// DOM ////////

    // TODO replace component handler everywhere
    updateMDL() {
        if (!(typeof (componentHandler) == 'undefined')) {
            componentHandler.upgradeAllRegistered();
        }
    }

    /**
    * Checks if an id corresponds to an element and shows it. Otherwise, the application warns about it
    * @param (number) id Id of an element to get from database
    */
    show(id) {
        try {
            var object = document.getElementById(id);
            object.style.display = 'inline';
            object.style.visibility = 'visible';
        } catch (err) {
            console.log("Can't find object by id: {}".format(id));
        }
    }

    /**
     * This function hides the id shown with "show()" function in case it exists. If not, it will warn you
     * @param (string) id name of object to hide
     */
    hide(id) {
        try {
            var object = document.getElementById(id);
            object.style.display = 'none';
        } catch (err) {
            console.log("Can't find object by id: {}".format(id));
        }
    }




    //////// ENCODERS ////////

    /**
     * Encodes a string into base-64
     */
    encodeSTR(string) {
        return btoa(unescape(encodeURIComponent(string)));
    }


    /**
     * Finds the cookie of a determined value
     * @param (string) name The value you will take to find its cookie
     */
    getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
    }


    /**
     * This function makes a cookie in a determined value
     * @param (string) name The value you will send the cookie to.
     * @param (Object) data The values of the cookie to send.
     * @param (number) minutes The time that the cookie will last
     */
    setCookie(name, data, minutes) {
        if (minutes === 0) {
            document.cookie = name + "=" + data + ";";
        } else {
            var d = new Date();
            d.setTime(d.getTime() + (minutes * 60 * 1000));
            /////// Include ¡¡¡¡¡ secure; !!!!!! //////////
            document.cookie = name + "=" + data + "; expires=" + d.toUTCString();
        }
    }

    /*
       getMinutesUTC(time) {
           var filter = /^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$/;
           try {
               if (!filter.test(time)) {
                   return null;
               }
               var offset = new Date().getTimezoneOffset();
               var off = time.split(':');
               var minutes = (+off[0]) * 60 + (+off[1]);
               return minutes + offset;
           } catch (error) {
               console.log(error);
               return null;
           }
       }
   
       getTimeUTC(time) {
           if (time === "null") {
               return "";
           }
           var offset = new Date().getTimezoneOffset();
           time = parseInt(time) - offset;
           var hours = Math.floor(time / 60);
           if (hours < 10) {
               hours = "0" + hours.toString()
           }
           var minutes = time % 60;
           if (minutes < 10) {
               minutes = "0" + minutes.toString()
           }
           return "{}:{}".format(hours, minutes);
       }
       */
}


Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
};

NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
};

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

String.prototype.render = function (args) {
    var reg = "";
    Object.keys(args).forEach(n => {
        reg += (reg != "" ? "|" : "") + "{{" + n + "}}";
    });
    var re = new RegExp(reg, "gi");
    return this.replace(re, function (match) {
        var str = args[match.substring(2, match.length - 2)];
        return str != null ? str : "";
    });
};