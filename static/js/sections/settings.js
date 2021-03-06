class Settings {
    constructor(grid) {
        this.grid = grid;
        this.templates = new settingsTemplates();
    }

    list() {
        if (!session.refresh()) return;
        var menu = [
            {
                id: 1,
                icon: "mail",
                title: "Email",
                text: "Change account's email"
            },
            {
                id: 2,
                icon: "key",
                title: "Password",
                text: "Change account's password"
            },
            {
                id: 3,
                icon: "trash-2",
                title: "Delete",
                text: "Permanently delete this account"
            }
        ];
        var cards = "";
        menu.forEach((n) => {
            cards += this.templates.menuCard.render(n);
        });
        ui.draw(this.grid, this.templates.menu.format(cards));
    }

    see(id) {
        if (!session.refresh()) return;;
        $('.modal').modal('hide');
        if (id == 1) tools.showModal('email');
        if (id == 2) tools.showModal('password');
        if (id == 3) tools.showModal('destroy');
    }


    email() {
        $('#email1').tooltip('hide');
        $('#email2').tooltip('hide');
        $('#emailPassword').tooltip('hide');
        var email1 = String($('#email1')[0].value).toLowerCase();;
        var email2 = String($('#email2')[0].value).toLowerCase();;
        var pw = $('#emailPassword')[0].value;

        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!re.test(email1)) {
            $('#email1').tooltip('show');
            return;
        }
        if (email1 != email2) {
            $('#email2').tooltip('show');
            return;
        }
        tools.sreq('/settings/email', function (status, response) {
            if (status == 401) {
                $('#emailPassword').tooltip('show');
            } else if (status == 418) {
                $('#email1').tooltip('show');
            } else if (status == 200 && response == "done") {
                tools.hideModal('email');
                tools.alert('This session has been closed. <b>Please verify the new email by clicking on the link sent.</b>', 'alert-triangle', 'info');
                tools.showSuccess('Changes saved');
                document.cookie = "Username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                document.cookie = "Session=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            } else {
                tools.hideModal('email');
                tools.alert(`Something went wrong ({})! If the problem persists please contact
                me at <a href="mailto:efren@boyarizo.es">efren@boyarizo.es</a>`.format(status), 'alert-triangle', 'danger');
                tools.showFailure(status);
            }
        }.bind(this), { 'email': email1, 'pw': pw });
    }


    password() {
        $('#passwordOld').tooltip('hide');
        $('#passwordNew1').tooltip('hide');
        $('#passwordNew2').tooltip('hide');
        var old = $('#passwordOld')[0].value;
        var new1 = $('#passwordNew1')[0].value;
        var new2 = $('#passwordNew2')[0].value;

        var rPw = /^[A-Za-z0-9]+$/;

        if (!old.length) {
            $('#passwordOld').tooltip('show');
            return;
        }
        if (new1.length < 8 || new2.length > 20 || !rPw.test(new1)) {
            $('#passwordNew1').tooltip('show');
            return;
        }
        if (new1 != new2) {
            $('#passwordNew2').tooltip('show');
            return;
        }
        tools.sreq('/settings/password', function (status, response) {
            if (status == 401) {
                $('#passwordOld').tooltip('show');
            } else if (status == 200 && response == "done") {
                tools.hideModal('password');
                tools.showSuccess('Changes saved');
                ui.load('settings');
            } else {
                tools.hideModal('password');
                tools.alert(`Something went wrong ({})! If the problem persists please contact
                me at <a href="mailto:efren@boyarizo.es">efren@boyarizo.es</a>`.format(status), 'alert-triangle', 'danger');
                tools.showFailure(status);
            }
        }.bind(this), { 'old': old, 'new': new1 });
    }

    destroy() {
        $('#destroyEmail').tooltip('hide');
        $('#destroyPassword1').tooltip('hide');
        $('#destroyPassword2').tooltip('hide');
        var email = String($('#destroyEmail')[0].value).toLowerCase();
        var pw1 = $('#destroyPassword1')[0].value;
        var pw2 = $('#destroyPassword2')[0].value;

        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!re.test(email) || tools.getCookie('Username') != email) {
            $('#destroyEmail').tooltip('show');
            return;
        }
        if (!pw1.length) {
            $('#destroyPassword1').tooltip('show');
            return;
        }
        if (pw1 != pw2) {
            $('#destroyPassword2').tooltip('show');
            return;
        }
        tools.sreq('/settings/destroy', function (status, response) {
            if (status == 401) {
                $('#destroyPassword1').tooltip('show');
            } else if (status == 200 && response == "done") {
                tools.hideModal('destroy');
                tools.showSuccess('Changes saved');
                tools.alert('This account has been deleted. <b>This session will be closed in 5 seconds.</b>', 'alert-triangle', 'info');
                setTimeout(function () {
                    session.LogOut();
                }, 5000);
            } else {
                tools.hideModal('password');
                tools.alert(`Something went wrong ({})! If the problem persists please contact
                me at <a href="mailto:efren@boyarizo.es">efren@boyarizo.es</a>`.format(status), 'alert-triangle', 'danger');
                tools.showFailure(status);
            }
        }.bind(this), { 'email': email, 'pw': pw1 });
    }
}


class settingsTemplates {
    constructor() {

        this.menuCard = `
    <div class="col-sm-4 mb-3" onclick="settings.see({{id}})" style="cursor: pointer;">
        <div class="card">
          <div class="card-body ">
          <center>
            <i style="width: 24px; height: 24px;" class="mb-3 mt-3" data-feather="{{icon}}"></i>
            <h5 class="card-title">{{title}}</h5>
            <p class="card-text">{{text}}</p>
          </center>
          </div>
        </div>
      </div>`;

        this.menu = `<div class="row d-flex justify-content-around">
    {}
</div>

<div class="modal" tabindex="-1" role="dialog" id="email">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Change email</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form autocomplete="off">
                    <input style="display:none" type="email">
                    <input style="display:none" type="password">
                    <div class="form-group">
                        <label>New email</label>
                        <input type="email" class="form-control" data-toggle="tooltip"
                        data-placement="top" title="Input a valid email address" id="email1">
                        <small class="form-text text-muted">The email is only used to login</small>
                    </div>
                    <div class="form-group">
                        <label>Repeat new email</label>
                        <input type="email" class="form-control" autocomplete="nope" data-toggle="tooltip"
                        data-placement="top" title="Emails do not match" id="email2">
                    </div>
                    <div class="form-group">
                        <label>Confirm password</label>
                        <input type="password" class="form-control" autocomplete="new-password" data-toggle="tooltip"
                        data-placement="top" title="Wrong password" id="emailPassword">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success" onclick="settings.email()"><i data-feather="save"></i>&nbsp;Save</button>
            </div>
        </div>
    </div>
</div>

<div class="modal" tabindex="-1" role="dialog" id="password">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Change password</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form autocomplete="off">
                    <input style="display:none" type="email">
                    <input style="display:none" type="password">
                    <div class="form-group">
                        <label for="exampleInputEmail1">Current password</label>
                        <input type="password" class="form-control" autocomplete="new-password" data-toggle="tooltip"
                        data-placement="top" title="Wrong password" id="passwordOld">
                    </div>
                    <div class="form-group">
                        <label>New password</label>
                        <input type="password" class="form-control" autocomplete="new-password" data-toggle="tooltip"
                        data-placement="top" title="8-20 characters. Only letters and numbers" id="passwordNew1">
                    </div>
                    <div class="form-group">
                        <label>Repeat new password</label>
                        <input type="password" class="form-control" autocomplete="new-password" data-toggle="tooltip"
                        data-placement="top" title="Passwords do not match" id="passwordNew2">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success" onclick="settings.password()"><i data-feather="save"></i>&nbsp;Save</button>
            </div>
        </div>
    </div>
</div>

<div class="modal" tabindex="-1" role="dialog" id="destroy">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete account</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form autocomplete="off">
                    <input style="display:none" type="email">
                    <input style="display:none" type="password">
                    <div class="form-group">
                        <label>Current email</label>
                        <input type="email" class="form-control" autocomplete="nope" data-toggle="tooltip"
                        data-placement="top" title="Input a valid email address" id="destroyEmail">
                    </div>
                    <div class="form-group">
                        <label>Current password</label>
                        <input type="password" class="form-control" autocomplete="new-password" data-toggle="tooltip"
                        data-placement="top" title="Wrong password / email" id="destroyPassword1">
                    </div>
                    <div class="form-group">
                        <label>Repeat password</label>
                        <input type="password" class="form-control" autocomplete="new-password" data-toggle="tooltip"
                        data-placement="top" title="Passwords do not match" id="destroyPassword2">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-danger" onclick="settings.destroy()"><i data-feather="crosshair"></i>&nbsp;Delete</button>
            </div>
        </div>
    </div>
</div>`;
    }
}

var settings = new Settings("settingsGrid");
ui.modules["settings"] = {
    modules: [],
    class: function () {
        return settings;
    },
    grid: "settingsGrid",
    icon: "settings",
    translation: "Account settings",
    onList: function () { }
};