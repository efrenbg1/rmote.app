class Manager {
    constructor(grid) {
        this.grid = grid;
        this.templates = new managerTemplates();
    }

    // TODO Añadir this looks empty con el perrito

    list() {
        tools.sreq('/manager/list', function (status, response) {
            if (status != 200) {
                tools.showFailure(status);
                return;
            }
            var own = "";
            var share = "";
            var html = "";
            this.boards = response['own'].concat(response['share']);
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
            html += this.templates.divider.format('New board') + this.templates.grid.format(this.templates.newCard) + this.templates.modals;
            ui.draw(this.grid, html);
        }.bind(this));
    }

    add() {
        if (!session.refresh()) return;
        var mac = document.getElementById("new_MAC").value;
        var name = document.getElementById("new_Name").value;
        var filter = /^([a-zA-Z0-9]{1,15})$/;
        var re = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/;
        if (!re.test(mac)) {
            $('#new_MAC').tooltip('show');
            return;
        }
        $('#new_MAC').tooltip('hide');
        if (!filter.test(name)) {
            $('#new_Name').tooltip('show');
            return;
        }
        $('#new_Name').tooltip('hide');
        tools.sreq('/manager/add', function (status, response) {
            if (status === 200) {
                tools.showSuccess("Board has been added");
                ui.load('manager');
            } else {
                tools.showFailure(status);
            }
        }.bind(this), { 'mac': mac, 'name': name });
    }

    save(mac) {
        if (!session.refresh()) return;
        var name = document.getElementById(mac).value;
        var filter = /^([a-zA-Z0-9]{1,15})$/;
        if (!filter.test(name)) {
            $('#' + mac.replace(/:/g, "\\:")).tooltip('show');
        } else {
            $('#' + mac.replace(/:/g, "\\:")).tooltip('hide');
            tools.sreq('/manager/name', function (status, response) {
                if (status === 200) {
                    tools.showSuccess("The new name has been saved");
                    ui.load('manager');
                } else {
                    tools.showFailure(status);
                }
            }.bind(this), {
                'mac': mac,
                'name': name,
            });
        }
    }

    share(mac) {
        if (!session.refresh()) return;
        if (mac === undefined) {
            var email = String($('#email')[0].value).toLowerCase();
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (re.test(email) || email.length == 0) {
                tools.hideModal('share');
                tools.sreq('/manager/share', function (status, response) {
                    if (status == 200 && response['done']) {
                        tools.showSuccess('Changes saved')
                        this.list();
                        return;
                    }
                    tools.showFailure(status)
                }.bind(this), {
                    'mac': this.edit,
                    'email': email
                });
            } else {
                $('#email').tooltip('show');
            }
        } else {
            this.boards.forEach((n) => {
                if (n.mac == mac) {
                    $('#email')[0].value = n.shareWith;
                    this.edit = n.mac;
                    tools.showModal('share');
                    return;
                }
            });
        }
    }

    remove(mac) {
        if (!session.refresh()) return;
        if (mac == undefined) {
            var invalid = false;
            this.boards.forEach((n) => {
                if (n.mac == this.edit) {
                    var name = $('#removeName');
                    if (name[0].value != n.name) {
                        name.tooltip('show');
                        invalid = true;
                    }
                }
            });
            if (invalid) return;
            tools.hideModal('remove');
            tools.sreq('/manager/remove', function (status, response) {
                if (status == 200 && response['done']) {
                    tools.showSuccess('Changes saved')
                    this.list();
                    return;
                }
                tools.showFailure(status);
            }.bind(this), { 'mac': this.edit });
        } else {
            this.boards.forEach((n) => {
                if (n.mac == mac) {
                    $('#removeTitle')[0].innerText = "Remove board: {{mac}} ({{name}})".render(n);
                    this.edit = n.mac;
                    tools.showModal('remove');
                    return;
                }
            });
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

        this.modals = `<div class="modal" tabindex="-1" role="dialog" id="share">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body">
                <button type="button" class="close mt-n2" data-dismiss="modal" aria-label="Close">×</button>
                <div class="mt-3 text-center">
                    <h5 class="modal-title mt-4">Insert e-mail address of receiver&nbsp;(blank to disable it):</h5>
                    <div class="input-group mt-4">
                        <div class="input-group-prepend">
                            <span class="input-group-text"><i data-feather="mail"></i></span>
                        </div>
                        <input type="email" class="form-control" placeholder="Email" aria-label="Email" id="email"
                            rel="email" title="Use a valid email" data-placement="top">
                    </div>
                </div>
                <div class="mt-4 text-right">
                    <button type="button" class="btn btn-primary" onclick="manager.share()"><i
                            data-feather="share-2"></i>&nbsp;Share</button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="modal" tabindex="-1" role="dialog" id="remove">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body">
                <button type="button" class="close mt-n2" data-dismiss="modal" aria-label="Close">×</button>
                <div class="mt-3 text-center">
                    <h5 class="modal-title mt-4" id="removeTitle"></h5>
                    <div class="input-group mt-4">
                        <div class="input-group-prepend">
                            <span class="input-group-text"><i data-feather="clipboard"></i></span>
                        </div>
                        <input type="text" class="form-control" placeholder="Confirm name to remove" aria-label="Name" id="removeName"
                            rel="removeName" title="Input the name to confirm" data-placement="top">
                    </div>
                </div>
                <div class="mt-4 text-right">
                    <button type="button" class="btn btn-danger" onclick="manager.remove()"><i
                            data-feather="trash-2"></i>&nbsp;Remove</button>
                </div>
            </div>
        </div>
    </div>
</div>
`;

        this.grid = `<div class="row d-flex justify-content-around">
    {}
</div>`;

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
				<input type="text" class="form-control" placeholder="Board name" value="{{name}}" id="{{mac}}" rel="name" title="Only letters and numbers" data-placement="top" maxlength="15">
			</div>
		</div>
		<div class="card-footer text-muted bg-white">
			<div class="container">
                <div class="row">
                    <div class="col-4 text-left px-0">
						<button type="button" class="btn btn-outline-danger" title="Remove board" onclick="manager.remove('{{mac}}')">
							<i data-feather="trash-2"></i>
						</button>
					</div>
					<div class="col-4 text-center px-0">
						<button type="button" class="btn btn-outline-primary" title="Share board" onclick="manager.share('{{mac}}')">
							<i data-feather="share-2"></i>
						</button>
                    </div>
                    <div class="col-4 text-right px-0">
						<button type="button" class="btn btn-outline-success" title="Save name" onclick="manager.save('{{mac}}')">
							<i data-feather="save"></i>
						</button>
					</div>
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
                    <button type="button" class="btn btn-outline-danger" onclick="manager.remove('{{mac}}')" title="Remove board">
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
            <input type="text" class="form-control" placeholder="MAC address" id="new_MAC" rel="name" title="Input a valid MAC address (XX:XX:XX:XX:XX)" data-placement="top" maxlength="17">
        </div>
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text">Name:</span>
            </div>
            <input type="text" class="form-control" placeholder="Board name" id="new_Name" rel="name" title="Only letters and numbers" data-placement="top" maxlength="15">
        </div>
    </div>
    <div class="card-footer text-muted bg-white">
        <div class="container">
            <div class="row">
                <div class="col-4 px-0">
                </div>
                <div class="col-4 text-center px-0">
                    <button type="button" class="btn btn-outline-success" title="Add board" onclick="manager.add()">
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


var manager = new Manager("managerGrid");
ui.modules["manager"] = {
    modules: [],
    class: function () {
        return manager;
    },
    grid: "managerGrid",
    icon: "edit",
    translation: "Boards manager",
    onList: function () { }
};