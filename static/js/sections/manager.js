class Manager {
    constructor() {
        this.templates = new managerTemplates();
    }

    list() {
        tools.sreq('/manager/list', function (status, response) {
            if (status != 200) {
                // TODO mostrar modal error
            }
            var cards = "";
            var boards = Object.keys(response['own']);
            this.total = boards.length;
            for (var i = 0; i < boards.length; i++) {
                var MAC = response['own'][i]['mac'];
                var name = response['own'][i]['name'];
                var shareWith = response['own'][i]['shareWith'];
                cards += this.templates.card.render({
                    MAC: MAC,
                    name: name,
                    shareWith: shareWith
                });
            }
            if (response['share'].length > 0) {
                this.total = this.total + response['share'].length;
                var cards = cards + this.templates.divider.format('Shared');
                for (var i = 0; i < response['share'].length; i++) {
                    var MAC = response['share'][i]['mac'];
                    var name = response['share'][i]['name'];
                    cards = cards + this.templates.shared.render({
                        name: name,
                        MAC: MAC
                    });
                }
            }
            document.getElementById("grid").innerHTML = cards + this.templates.divider.format('New board') + this.templates.newCard;
            componentHandler.upgradeAllRegistered();
        }.bind(this));
    }

    add() {
        session.refresh();
        var mac = document.getElementById("new_MAC").value;
        var name = document.getElementById("new_Name").value;
        var filter = /^([a-zA-Z0-9]{1,10})$/;
        var re = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/;
        if (filter.test(name) && re.test(mac)) {
            tools.sreq('/manager/change', function (status, response) {
                if (status === 200) {
                    tools.snack("Done");
                    this.getCards();
                } else {
                    tools.snack("Failed!")
                }
                this.getCards();
            }.bind(this), { 'mac': mac, 'type': "8", 'name': name });
        } else {
            tools.snack("Wrong input");
        }
    }

    save(MAC) {
        session.refresh();
        var name = document.getElementById(MAC + "_name");
        //var autoOFF = this.getMinutesUTC(document.getElementById(MAC + "_off").value);
        //var autoON = this.getMinutesUTC(document.getElementById(MAC + "_on").value);
        var cluster = (document.getElementById(MAC + "_cluster").checked) ? '1' : '0';
        var filter = /^([a-zA-Z0-9]{1,10})$/;
        if (!filter.test(name.value)) {
            tools.show(MAC + "_characters");
        } else {
            tools.hide(MAC + "_characters");
            tools.req('/manager/change', function (status, response) {
                if (status === 200) {
                    tools.snack("Done");
                    this.getCards();
                } else {
                    tools.snack("Failed!")
                }
            }.bind(this), {
                'mac': MAC,
                'type': "0",
                'name': name.value,
                'cluster': cluster
                /*'autoOFF': autoOFF,
                'autoON': autoON*/
            });
        }
    }

    checkShare() {
        var email = document.getElementById("email");
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (email.value.length > 0) {
            if (!filter.test(email.value)) {
                tools.show("valid");
                tools.hide("save");
            } else {
                tools.hide("valid");
                tools.show("save");
            }
        } else {
            tools.show("save");
            tools.hide("valid");
        }
    }

    share(MAC, old, email) {
        session.refresh();
        if (email === undefined) {
            showDialog({
                title: 'Insert e-mail address of receiver (blank to disable it):',
                text: `<center><form action="javascript:">
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <div class="popup">
            <span class="popuptext" id="valid">Please insert a valid email address or leave it blank to disable it</span></div>
            <input class="mdl-textfield__input" type="email" id="email" onkeyup="active.checkShare()" value="{}">
            <label class="mdl-textfield__label" for="sample1">Email:</label>
            </div>
            </form></center>`.format(old),
                positive: {
                    title: '<h style="color:green;">Share</h>',
                    id: 'save',
                    onClick: function () { active.share(MAC, old, true); }
                },
                negative: {
                    title: '<h style="color:red;" disabled>Cancel</h>'
                },
                onLoaded: function () {
                    tools.hide("save");
                }
            });
        } else {
            var email = document.getElementById("email").value;
            tools.hideDiag();
            tools.showLoading();
            tools.req('/manager/change', function (status, response) {
                if (status === 200) {
                    tools.snack("Done");
                    this.getCards();
                } else {
                    tools.hideDiag();
                    tools.snack("Failed!");
                }
            }.bind(this), { "type": "1", "email": tools.encodeSTR(email), "mac": MAC });
        }
    }

    removeShare(MAC, force) {
        session.refresh();
        if (force) {
            tools.req('/manager/change', function (status, response) {
                tools.hideDiag();
                if (status === 200) {
                    tools.snack("Done");
                    this.getCards();
                } else {
                    tools.snack("Failed!");
                }
            }.bind(this), { "type": "1", "email": "", "mac": MAC });
        } else {
            if (this.total !== 1 || confirm("Removing the last board will delete this account! Are you sure?")) {
                showDialog({
                    title: `<h3 class="mdl-dialog__title" style="width:100%">Are you sure?</h3>`,
                    text: `<br><center>Shared boards can't be added by user</center><br>`,
                    negative: {
                        title: '<h style="color:green;" disabled>No</h>',
                    },
                    positive: {
                        title: '<h style="color:red;" disabled>Yes</h>',
                        onClick: function () {
                            active.removeShare(MAC, true);
                        }
                    },
                    cancelable: true,
                    contentStyle: { 'max-width': '300px' },
                });
            }
        }
    }

    remove(MAC, force) {
        session.refresh();
        if (force) {
            tools.req('/manager/change', function (status, response) {
                tools.hideDiag();
                if (status === 200) {
                    tools.snack("Done");
                    this.getCards();
                } else {
                    tools.snack("Failed!");
                }
            }.bind(this), { 'mac': MAC, 'type': "9" });
        } else {
            if (this.total !== 1 || confirm("Removing the last board will delete this account! Are you sure?")) {
                showDialog({
                    title: '<h3 class="mdl-dialog__title" style="width:100%">Are you sure?</h3>',
                    text: '<br>',
                    negative: {
                        title: '<h style="color:green;" disabled>No</h>',
                    },
                    positive: {
                        title: '<h style="color:red;" disabled>Yes</h>',
                        onClick: function () {
                            active.remove(MAC, true);
                        }
                    },
                    cancelable: true,
                    contentStyle: { 'max-width': '300px' },
                });
            }
        }
    }
}



class managerTemplates {
    constructor() {
        this.divider = `
<div class="mdl-cell mdl-cell--12-col">
<div class="hr-sect"><span class="mdl-layout-title">{}</span></div>
</div>
  `;

        this.card = `<div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">
  <div
    class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
    <div class="on mdl-card--expand mdl-color--teal-300"></div>
    <div class="mdl-card__supporting-text mdl-color-text--grey-900">{{MAC}}</div>
    <div class="popup" style="width:100%"
      onclick="document.getElementById('{{MAC}}_characters').style.display = 'none';">
      <span class="popuptext" id="{{MAC}}_characters">- 8-20 characters<br>- Only letters and numbers</span></div>
    <div class="popup" style="width:100%" onclick="document.getElementById('{{MAC}}_old').style.display = 'none';">
      <span class="popuptext" id="{{MAC}}_old">Please use a new name</span></div>
    <div style="margin:0 auto;"
      class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty is-upgraded"
      data-upgraded=",MaterialTextfield">
      <input class="mdl-textfield__input" type="text" name="name" value="{{name}}" id="{{MAC}}_name">
      <label class="mdl-textfield__label" for="{{MAC}}_name" style="color:#00bcd4;">Change name:</label>
    </div>
    <div class="mdl-card__actions mdl-card--border">
      <center>
        <button href="#" class="mdl-button mdl-js-button mdl-js-ripple-effect" onclick="active.save('{{MAC}}')"
          style="color: #00bcd4;" data-upgraded=",MaterialButton,MaterialRipple">
          Save
          <span class="mdl-button__ripple-container"><span class="mdl-ripple"></span></span></button>
        <button class="mdl-button mdl-js-button" style="color:#3CB92A;" onclick="active.share('{{MAC}}', '{{shareWith}}');"
          data-upgraded=",MaterialButton">
          <i class="material-icons">share</i>
        </button>
        <button class="mdl-button mdl-js-button" style="color:red;" onclick="active.remove('{{MAC}}');"
          data-upgraded=",MaterialButton">
          Remove
        </button>
      </center>
    </div>
  </div>
</div>`;

        this.shared = `<div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">
    <div
        class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
        <div class="on mdl-card--expand mdl-color--teal-300"> </div>
        <div class="mdl-card__supporting-text mdl-color-text--grey-900">{{name}} ({{MAC}})</div>
        </center>
        <div class="mdl-card__actions mdl-card--border">
            <center>
                <button class="mdl-button mdl-js-button" style="color:red;" onclick="active.removeShare('{{MAC}}');"
                    data-upgraded=",MaterialButton">
                    Remove
                </button>
            </center>
        </div>
    </div>
</div>`;

        this.newCard = `<div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">
    <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
    <div class="new mdl-card--expand mdl-color-add"> </div>
    <center>
    <div style="margin:0 auto;"
         class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty is-upgraded"
         data-upgraded=",MaterialTextfield">
      <input class="mdl-textfield__input" type="text" name="name" id="new_MAC" name="MAC">
      <label class="mdl-textfield__label" for="{}_name" style="color:#00bcd4;">MAC:</label>
    </div>
    <div style="margin:0 auto;"
         class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty is-upgraded"
         data-upgraded=",MaterialTextfield">
      <input class="mdl-textfield__input" type="text" name="name" id="new_Name">
      <label class="mdl-textfield__label" for="{}_name" style="color:#00bcd4;">Name:</label>
    </div>
    </center>
    <button class="mdl-button mdl-js-button mdl-js-ripple-effect" type="button" onclick="active.add()">Add</button>
    </div>
    </div>`
    }
}


var manager = new Manager();
nav.modules["manager"] = {
    class: function () {
        return manager;
    },
    icon: "edit",
    name: "Boards manager"
};