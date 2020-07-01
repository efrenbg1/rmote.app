class Settings {
    constructor() {
        this.templates = new settingsTemplates();
    }

    list() {
        if (!session.check()) {
            session.showLogIn('message-square', 'LogIn to continue', 'info');
            return;
        }
        session.refresh();
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
                text: "Permanently delete account"
            }
        ];
        var cards = "";
        menu.forEach((n) => {
            cards += this.templates.menuCard.render(n);
        });
        tools.draw(this.templates.menu.format(cards));
    }

    see(id) {
        if (!session.check()) {
            session.showLogIn('message-square', 'LogIn to continue', 'info');
            return;
        }
        session.refresh();
    }

    mail() {
        session.refresh();
        showDialog({
            title: 'Change email:',
            text: `<center><form action="javascript:" autocomplete="off">
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <div class="popup">
            <span class="popuptext" id="valid">Please insert a valid email address</span></div>
            <input class="mdl-textfield__input" type="email" id="input-1" onkeyup="active.checkEmail()" autocomplete="false">
            <label class="mdl-textfield__label" for="sample1">New email</label>
            </div>
            <div class="mdl-textfield mdl-js-textfield">
            <div class="popup">
            <span class="popuptext" id="match">Emails don´t match</span></div>
            <input class="mdl-textfield__input" type="email" id="input-2" onkeyup="active.checkEmail()">
            <label class="mdl-textfield__label" for="sample1">Repeat</label>
            </div>
            <div class="mdl-textfield mdl-js-textfield">
            <div class="popup">
            <span class="popuptext" id="pw">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
            </div>
            <input class="mdl-textfield__input" type="password" id="input-3" onkeyup="active.checkEmail()" autocomplete="new-password">
            <label class="mdl-textfield__label" for="input-3">Confirm password</label>
            </div>
            </form></center>`,
            positive: {
                title: '<h style="color:green;">Save</h>',
                id: 'save',
                onClick: function () { active.updateEmail(); }
            },
            negative: {
                title: '<h style="color:red;" disabled>Cancel</h>'
            },
            onLoaded: function () {
                tools.hide("save");
            }
        });
    }

    password() {
        session.refresh();
        showDialog({
            title: 'Change password:',
            text: `<center>
  <form action="javascript:" autocomplete="off">
    <div class="popup mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup1">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <input class="mdl-textfield__input" type="password" id="input-1" onkeyup="active.checkPass()" autocomplete="new-password">
      <label id="input-1-text" class="mdl-textfield__label" for="sample1">Current password</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup2">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <div class="popup">
        <span class="popuptext" id="popup2_old">Can´t be the same as your older password</span></div>
      <input class="mdl-textfield__input" type="password" id="input-2" onkeyup="active.checkPass()" autocomplete="new-password">
      <label id="input-2-text" class="mdl-textfield__label" for="sample1">New password</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup3">Passwords don´t match</span></div>
      <input class="mdl-textfield__input" type="password" id="input-3" onkeyup="active.checkPass()" autocomplete="new-password">
      <label id="input-3-text" class="mdl-textfield__label" for="sample1">Repeat</label>
    </div>
  </form>
</center>`,
            positive: {
                title: '<h style="color:green;">Save</h>',
                id: 'save',
                onClick: function () { active.updatePassword(); }
            },
            negative: {
                title: '<h style="color:red;" disabled>Cancel</h>'
            },
            onLoaded: function () {
                tools.hide("save");
                tools.hide("popup1");
            }
        });
    }

    destroy() {
        session.refresh();
        showDialog({
            title: 'Please confirm data to delete the account:',
            text: `<center>
  <form action="javascript:" autocomplete="off">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <div class="popup">
        <span class="popuptext" id="popup2">Wrong email address</span></div>
      <input class="mdl-textfield__input" type="text" id="input-1" onkeyup="active.checkDestroy()" autocomplete="false">
      <label class="mdl-textfield__label" for="sample1">Email</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <div class="popup">
        <span class="popuptext" id="popup3">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <input class="mdl-textfield__input" type="password" id="input-2" onkeyup="active.checkDestroy()" autocomplete="new-password">
      <label class="mdl-textfield__label" for="sample1">Password</label>
    </div>
  </form>
</center>`,
            positive: {
                title: '<h style="color:red;">Delete</h>',
                id: 'delete',
                onClick: function () { active.destroyAccount(); }
            },
            negative: {
                title: '<h style="color:green;" disabled>Cancel</h>'
            },
            onLoaded: function () {
                tools.hide("delete");
            }
        });
    }


    updateEmail() {
        if (this.checkEmail()) {
            var input_1 = document.getElementById("input-1").value;
            var input_3 = document.getElementById("input-3").value;
            tools.req('/settings/email', function (status, response) {
                if (status === 200) {
                    alert("E-mail has been changed! Reloading session...");
                    session.logOut();
                } else {
                    tools.snack("Something went wrong")
                }
            }.bind(this), { 'new': tools.encodeSTR(input_1), 'pw': tools.encodeSTR(input_3) });
        }
    }

    updatePassword() {
        if (this.checkPass()) {
            var input_1 = document.getElementById("input-1").value;
            var input_2 = document.getElementById("input-2").value;
            tools.req('/settings/password', function (status, response) {
                if (status === 200) {
                    alert("Password succesfully changed");
                } else {
                    tools.snack("Something went wrong")
                }
            }.bind(this), { 'pw': tools.encodeSTR(input_1), 'new': tools.encodeSTR(input_2) });
        }
    }

    destroyAccount() {
        if (this.checkDestroy()) {
            var input_2 = document.getElementById("input-2").value;
            tools.req('/settings/destroy', function (status, response) {
                if (status === 200) {
                    alert("Account succesfully deleted");
                    session.logOut();
                } else {
                    tools.snack("Something went wrong")
                }
            }.bind(this), { 'pw': tools.encodeSTR(input_2) });
        }
    }


    checkEmail() {
        var email = document.getElementById("input-1").value;
        var email2 = document.getElementById("input-2").value;
        var pw = document.getElementById("input-3").value;
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        var filter2 = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,20})$/;
        if (email) {
            if (!filter.test(email)) {
                tools.show("valid");
                tools.hide("match");
                tools.hide("pw");
            } else {
                tools.hide("valid");
                if (email == email2) {
                    if (!filter2.test(pw)) {
                        tools.show("pw");
                        tools.hide("match");
                    } else {
                        tools.show("save");
                        tools.hide("match");
                        tools.hide("pw");
                        return true;
                    }
                } else {
                    tools.show("match");
                    tools.hide("pw");
                }
            }
        } else {
            tools.hide("match");
            tools.hide("valid");
            tools.hide("pw");
        }
        return false;
    }

    checkPass() {
        var input_1 = document.getElementById("input-1");
        var input_2 = document.getElementById("input-2");
        var input_3 = document.getElementById("input-3");
        var input_1_text = document.getElementById("input-1-text");
        var input_2_text = document.getElementById("input-2-text");
        var input_3_text = document.getElementById("input-3-text");
        var filter = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,20})$/;
        if (input_1.value) {
            if (!filter.test(input_1.value)) {
                tools.show("popup1");
                tools.hide("save");
                tools.hide("popup3");
                tools.hide("popup2");
                tools.hide("popup2_old");
            } else {
                tools.hide("popup1");
                tools.hide("popup2_old");
                if (input_2.value) {
                    if (!filter.test(input_2.value)) {
                        tools.show("popup2");
                        tools.hide("save");
                        tools.hide("popup3");
                    } else if (input_2.value == input_1.value) {
                        tools.hide("save");
                        tools.hide("popup3");
                        tools.hide("popup2");
                        tools.show("popup2_old");
                    } else {
                        tools.hide("popup2");
                        if (input_2.value == input_3.value) {
                            tools.show("save");
                            tools.hide("popup3");
                            return true;
                        } else {
                            tools.show("popup3");
                            tools.hide("save");
                        }
                    }
                } else {
                    tools.hide("save");
                    tools.hide("popup2");
                }
            }
        } else {
            tools.hide("save");
            tools.hide("popup1");
        }
        return false;
    }

    checkDestroy() {
        var email = document.getElementById("input-1");
        var pw = document.getElementById("input-2");
        var filter_email = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        var filter_pw = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,20})$/;
        if (tools.getCookie('Username') == "") {
            session.logIn("Session expired");
        }
        if (email.value) {
            if (tools.getCookie('Username') != email.value) {
                tools.show("popup2");
                tools.hide("popup3");
                tools.hide("delete");
            } else if (tools.getCookie('Username') == email.value) {
                tools.hide("popup2");
                tools.hide("delete");
                if (pw.value) {
                    if (!filter_pw.test(pw.value)) {
                        tools.show("popup3");
                    } else {
                        tools.show("delete");
                        tools.hide("popup3");
                        return true;
                    }
                }
            }
        } else {
            tools.hide("popup2");
            tools.hide("popup3");
            tools.hide("delete");
        }
        return false;
    }
}


class settingsTemplates {
    constructor() {

        this.menuCard = `
    <div class="col-sm-4 mb-3">
        <div class="card" onclick="settings.see({{id}})">
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
                        <label for="exampleInputEmail1">New email</label>
                        <input type="email" class="form-control">
                        <small class="form-text text-muted">The email is only used to login</small>
                    </div>
                    <div class="form-group">
                        <label>Repeat new email</label>
                        <input type="email" class="form-control" autocomplete="nope">
                    </div>
                    <div class="form-group">
                        <label>Confirm password</label>
                        <input type="password" class="form-control" autocomplete="new-password">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success"><i data-feather="save"></i>&nbsp;Save</button>
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
                        <input type="password" class="form-control" autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label>New password</label>
                        <input type="password" class="form-control" autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label>Repeat new password</label>
                        <input type="password" class="form-control" autocomplete="new-password">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success"><i data-feather="save"></i>&nbsp;Save</button>
            </div>
        </div>
    </div>
</div>

<div class="modal" tabindex="-1" role="dialog" id="destroy">
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
                        <label for="exampleInputEmail1">Current password</label>
                        <input type="password" class="form-control" autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label>New password</label>
                        <input type="password" class="form-control" autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label>Repeat new password</label>
                        <input type="password" class="form-control" autocomplete="new-password">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success"><i data-feather="save"></i>&nbsp;Save</button>
            </div>
        </div>
    </div>
</div>`;
    }
}

var settings = new Settings();
nav.modules["settings"] = {
    class: function () {
        return settings;
    },
    icon: "settings",
    name: "Account settings"
};