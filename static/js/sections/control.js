// TODO poner title (ayudita) a todo lo que se pueda
class Control {
    constructor() {
        this.templates = new controlTemplates();
        this.version = 5;
        this.interval = null;
        this.status = [];
    }

    list() {
        tools.sreq('/control/list', function (status, response) {
            if (status !== 200) {
                tools.showFailure(status);
                return;
            }
            var cards = "";
            response['own'].forEach((n) => {
                n.update = "";
                if (n.version != null && parseInt(n.version) != this.version) n.update = this.templates.update;
                cards += this.templates.card.render(n);
            });
            if (response['share'].length > 0) cards += this.templates.divider.format('Shared');
            response['share'].forEach((n) => {
                n.update = "";
                if (n.version != null && parseInt(n.version) != this.version) n.update = this.templates.update;
                cards += this.templates.card.render(n);
            });
            clearInterval(this.interval);
            ui.draw('grid', this.templates.grid.format(cards), function () {
                this.updateCards(response['own']);
                this.updateCards(response['share']);
                this.interval = setInterval(function () {
                    control.update();
                }, 1000)
            }.bind(this));
        }.bind(this));
    }

    action(mac, payload) {
        if (payload == '1') {
            tools.showModal('forceoff');
            this.payload = payload;
            this.mac = mac;
            return;
        }
        if (payload == '8') {
            tools.showModal('firmware');
            this.payload = payload;
            this.mac = mac;
            return;
        }
        if (mac == undefined && payload == undefined) {
            mac = this.mac;
            payload = this.payload;
        }
        tools.sreq('/control/action', function (status, response) {
            if (status === 200) {
                tools.showSuccess('Command sent');
            } else {
                tools.showFailure(status);
            }
        }.bind(this), { 'mac': mac, 'payload': payload });
    }

    update() {
        tools.screq('/control/update', function (status, response) {
            if (status === 200) {
                this.updateCards(response);
            } else if (status === 400) {
                tools.showModal('error');
                clearInterval(control.interval);
            }
        }.bind(this));
    }

    updateCards(response) {
        if (!ui.section().includes('control')) return;
        var status = {
            null: '/img/papelito.png',
            "0": '/img/off.jpg',
            "1": '/img/on.jpg',
            "2": '/img/suspended.gif',
            "7": '/img/updating.gif',
            "8": '/img/recovery.jpg',
            "9": '/img/boardoff.png'
        };
        response.forEach((n) => {
            var stat = document.getElementById(n.mac + "_status");
            if (stat.src != status[n.status]) stat.src = status[n.status];
            var html = this.templates.waiting;
            switch (n.action) {
                case '0':
                    html = this.templates.turning;
                    break;
                case '1':
                    html = this.templates.turning;
                    break;
                case '2':
                    html = this.templates.turning;
                    break;
                case '3':
                    html = this.templates.turning;
                    break;
                case '4':
                    html = this.templates.turning;
                    break;
                case '5':
                    html = this.templates.failed;
                    break;
                case '6':
                    html = this.templates.done;
                    break;
                case null:
                    html = ""
                    break;
            }
            if (n.status == "9" || n.status == null) html = "";
            var action = document.getElementById(n.mac + "_action");
            if (action.innerHTML != html) action.innerHTML = html;
        });
        feather.replace();
    }
}


class controlTemplates {
    constructor() {
        this.divider = `<div class="hr-sect text-muted mt-3 mb-2">
    <span>
        <h5>{}</h5>
    </span>
</div>`;

        this.waiting = `<div class="alert alert-secondary text-center mb-0" role="alert">
            <i data-feather="check"></i>&nbsp;Waiting for command
        </div>`;

        this.turning = `<div class="alert alert-info text-center mb-0" role="alert">
        <span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>&nbsp;Working on it...
    </div>`;

        this.failed = `<div class="alert alert-danger text-center mb-0" role="alert">
            <i data-feather="alert-triangle"></i>&nbsp;Action failed
        </div>`;

        this.off = `<div class="alert alert-warning text-center mb-0" role="alert">
            <i data-feather="alert-triangle"></i>&nbsp;Board is offline
        </div>`;

        this.done = `<div class="alert alert-secondary text-center mb-0" role="alert" >
            <i data-feather="check"></i>&nbsp;Waiting for command
        </div>`;

        this.update = `<div class="alert alert-info text-center mb-0" role="alert">
    <i data-feather="download-cloud"></i>&nbsp;Update available
</div>`;

        this.grid = `<div class="row d-flex justify-content-around">
	{}
</div>

<div class="modal" id="forceoff" tabindex="-1" role="dialog">
	<div class="modal-dialog modal-dialog-centered" role="document">
		<div class="modal-content">
			<div class="modal-body">
				<form>
					<div class="mt-3 mb-5 text-center">
						<h3>Are you sure?</h3>
						<p>Forcing the PC to shutdown will cut the power, meaning all unsaved data will be lost.</p>
					</div>
					<div class="d-flex justify-content-between mb-2 mx-2">
						<button type="button" class="btn btn-outline-success" data-dismiss="modal"><i data-feather="corner-down-left"></i>&nbsp;Return
						</button>
						<button type="button" class="btn btn-outline-danger" data-dismiss="modal" onclick="control.action()"><i
								data-feather="x-octagon"></i>&nbsp;Force off</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>


<div class="modal" id="firmware" tabindex="-1" role="dialog">
	<div class="modal-dialog modal-dialog-centered" role="document">
		<div class="modal-content">
			<div class="modal-body">
				<form>
					<div class="mt-3 mb-5 text-center">
						<h3>Are you sure?</h3>
						<p>The board needs an active Internet connection and uninterrupted power.<br><b>Remember</b> that you will need to reload this page after the update to dismiss the message.</p>
					</div>
					<div class="d-flex justify-content-between mb-2 mx-2">
						<button type="button" class="btn btn-outline-success" data-dismiss="modal"><i data-feather="corner-down-left"></i>&nbsp;Return
						</button>
						<button type="button" class="btn btn-outline-danger" data-dismiss="modal" onclick="control.action()"><i
								data-feather="download-cloud"></i>&nbsp;Update</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>`;

        this.card = `<div class="col-sm-4 pb-3">
	<div class="card">
		<img class="card-img-top mb-0" src="/img/off.jpg" id="{{mac}}_status">
		{{update}}
		<div id="{{mac}}_action" class="mb-2"></div>
		<div class="card-body p-2">
			<h5 class="card-title text-center">{{name}}&nbsp;<small>({{mac}})</small></h5>
		</div>
		<div class="card-footer text-muted bg-white">
			<div class="container">
				<div class="row">
					<div class="col-4 px-0">
					</div>
					<div class="col-4 text-center px-0">
						<button type="button" class="btn btn-outline-danger" onclick="control.action('{{mac}}', '0')">
							<i data-feather="power"></i>
						</button>
					</div>
					<div class="col-4 text-right px-0">
						<div class="btn-group dropup">
							<button type="button" class="btn btn-outline-primary dropdown-toggle" data-toggle="dropdown"
								aria-haspopup="true" aria-expanded="false">
								<i data-feather="chevron-up"></i>
							</button>
							<div class="dropdown-menu dropdown-menu-right">
								<a class="dropdown-item pl-3 mb-1" href="javascript:control.action('{{mac}}', '8')"><i data-feather="download-cloud"></i>&nbsp;&nbsp;Update firmware</a>
								<a class="dropdown-item pl-3 mb-1" href="javascript:control.action('{{mac}}', '9')"><i data-feather="activity"></i>&nbsp;&nbsp;Recovery</a>
								<a class="dropdown-item pl-3" href="javascript:control.action('{{mac}}', '1')"><i data-feather="x-octagon"></i>&nbsp;&nbsp;Force off</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>`;
    }
}


var control = new Control();
ui.modules["control"] = {
    modules: [],
    class: function () {
        return control;
    },
    icon: "sliders",
    translation: "Control center",
    onList: function () { }
};