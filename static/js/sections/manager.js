class Manager {
    constructor() {
        this.templates = new managerTemplates();
    }

    list() {
        tools.sreq('/manager/list', function (status, response) {
            if (status != 200) {
                // TODO mostrar modal error
            }
            var own = "";
            var share = "";
            var html = "";
            var boards = Object.keys(response['own']);
            this.total = response['own'].length + response['share'].length;
            response['own'].forEach((n) => {
                own += this.templates.card.render(n);
            });
            html += this.templates.grid.format(own);
            response['share'].forEach((n) => {
                share += this.templates.shared.render(n);
            });
            if (response['share'].length > 0) {
                html += this.templates.divider.format('Shared') + this.templates.grid.format(share);
            }
            html += this.templates.divider.format('New board') + this.templates.grid.format(this.templates.newCard);
            tools.draw(html);
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
        this.divider = `<div class="hr-sect text-muted mt-3 mb-2">
    <span>
        <h5>{}</h5>
    </span>
</div>`;

        this.grid = `<div class="row d-flex justify-content-around">
{}
</div>
`;

        this.card = `<div class="col-sm-4 pb-3">
	<div class="card">
		<img class="card-img-top mb-0" src="/img/on.jpg">
		<div class="card-body p-2 mt-2">
			<h5 class="card-title text-center">{{mac}}</h5>
		</div>
		<div class="card-body py-0 px-2">
			<div class="input-group mb-3">
				<div class="input-group-prepend">
					<span class="input-group-text">Name:</span>
				</div>
				<input type="text" class="form-control" placeholder="Board name" value="{{name}}">
			</div>
		</div>
		<div class="card-footer text-muted bg-white">
			<div class="container">
				<div class="row">
					<div class="col-4 text-left px-0">
						<button type="button" class="btn btn-outline-success" title="Save name">
							<i data-feather="save"></i>
						</button>
					</div>
					<div class="col-4 text-center px-0">
						<button type="button" class="btn btn-outline-primary" title="Share board">
							<i data-feather="share-2"></i>
						</button>
					</div>
					<div class="col-4 text-right px-0">
						<button type="button" class="btn btn-outline-danger" title="Remove board">
							<i data-feather="trash-2"></i>
						</button>
					</div>
					</>
				</div>
			</div>
		</div>
	</div>
</div>`;

        this.shared = `<div class="col-sm-4 pb-3">
<div class="card">
    <img class="card-img-top mb-0" src="/img/on.jpg">
    <div class="card-body p-2 mt-2">
        <h5 class="card-title text-center">{{mac}}</h5>
    </div>
    <div class="card-body py-0 px-2">
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text">Name:</span>
            </div>
            <input type="text" class="form-control" placeholder="Board name" value="{{name}}" disabled>
        </div>
    </div>
    <div class="card-footer text-muted bg-white">
        <div class="container">
            <div class="row">
                <div class="col-4 px-0">
                </div>
                <div class="col-4 text-center px-0">
                    <button type="button" class="btn btn-outline-danger" title="Remove board">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
                <div class="col-4 px-0">
                </div>
            </div>
        </div>
    </div>
</div>
</div>`;

        this.newCard = `<div class="col-sm-4 pb-3">
<div class="card">
    <img class="card-img-top mb-0 mb-3" src="/img/on.jpg">
    <div class="card-body py-0 px-2">
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text">MAC:</span>
            </div>
            <input type="text" class="form-control" placeholder="MAC address">
        </div>
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text">Name:</span>
            </div>
            <input type="text" class="form-control" placeholder="Board name">
        </div>
    </div>
    <div class="card-footer text-muted bg-white">
        <div class="container">
            <div class="row">
                <div class="col-4 px-0">
                </div>
                <div class="col-4 text-center px-0">
                    <button type="button" class="btn btn-outline-success" title="Add board">
                        <i data-feather="save"></i>
                    </button>
                </div>
                <div class="col-4 px-0">
                </div>
            </div>
        </div>
    </div>
</div>
</div>`;
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