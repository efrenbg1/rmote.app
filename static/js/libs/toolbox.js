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
            session.showLogIn('message-square', 'LogIn to continue', 'alert-info');
            return;
        }
        this.timeoutLoading();
        if (this.socket == null || this.socket.disconnected) {
            this.callback.push(function () {
                tools.sreq(event, callback, headers);
            }.bind(this));
            this.sOpen();
            return;
        }
        this.socket.emit(event, headers, function (response, status) {
            this.hideLoading();
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


    //// MESSAGES ////

    alert(title, icon, type) {
        $('#alertImg')[0].src = "/img/405_{}.png".format(Math.floor(Math.random() * 2) + 1);
        var text = $('#alertText')[0];
        if (type == undefined) {
            text.setAttribute("class", 'mb-0 alert alert-danger');
        } else {
            text.setAttribute("class", 'mb-0 alert alert-{}'.format(type));
        }
        text.innerHTML = `<i data-feather="{}" class="rounded mr-1 inline-feather"></i>&nbsp;{}`.format(icon ? icon : 'alert-triangle', title);
        feather.replace();
        this.showModal('alert');
    }

    showModal(name) {
        $('#grid').removeAttr("class");
        $("#{}".format(name)).modal('show');
    }

    hideModal(name) {
        $("#" + name).modal("hide");
    }

    showFailure(code) {
        document.getElementById(
            "toastContent"
        ).innerHTML = `<i data-feather="alert-triangle" class="rounded mr-1 inline-feather" color="red"></i>
            <strong class="mr-auto" style="color:red;">Error al ejecutar la acción&nbsp;({})</strong>`.format(
            code
        );
        $("#toast").toast({ delay: 6000 });
        $("#toast").toast("show");
        feather.replace();
    }

    showWarning(msg) {
        document.getElementById(
            "toastContent"
        ).innerHTML = `<i data-feather="info" class="rounded mr-1 inline-feather text-muted"></i>
            <strong class="mr-auto text-muted">{}</strong>`.format(msg);
        $("#toast").toast({ delay: 6000 });
        $("#toast").toast("show");
        feather.replace();
    }

    showSuccess() {
        document.getElementById(
            "toastContent"
        ).innerHTML = `<i data-feather="check" class="rounded mr-1 inline-feather" color="green"></i>
            <strong class="mr-auto">Guardado correctamente</strong>`;
        $("#toast").toast({ delay: 6000 });
        $("#toast").toast("show");
        feather.replace();
    }

    showLoading() {
        $("#loading").modal({
            backdrop: "static",
            keyboard: false
        });
    }

    timeoutLoading() {
        this.hideLoading();
        this.loading = window.setTimeout(
            function () {
                $("#loading").modal({
                    backdrop: "static",
                    keyboard: false
                });
            }.bind(this),
            500
        );
    }

    hideLoading() {
        clearTimeout(this.loading);
        this.hideModal("loading");
    }


    //////// DOM ////////

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

    draw(html, callback) {
        var elapsed = performance.now() - this.animationTime;
        if (elapsed < 100) {
            setTimeout(function () {
                $('#grid')[0].innerHTML = html;
                if (callback != undefined) callback();
                if (tools.animationCallback != null) tools.animationCallback();
                tools.animationCallback = null;
                feather.replace();
                $('#grid')[0].setAttribute('class', 'slide-in');
            }, 100 - elapsed);
        } else {
            $('#grid')[0].innerHTML = html;
            if (callback != undefined) callback();
            if (tools.animationCallback != null) tools.animationCallback();
            tools.animationCallback = null;
            feather.replace();
            $('#grid')[0].setAttribute('class', 'slide-in');
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
}


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