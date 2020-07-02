// TODO poner title (ayudita) a todo lo que se pueda
class Control {
    constructor() {
        this.templates = new controlTemplates();
        this.version = 5;
        this.interval = null;
        this.status = [];
    }

    list() {
        session.refresh();
        tools.sreq('/control/list', function (status, response) {
            if (status !== 200) {
                tools.showFailure(status);
                return;
            }
            var cards = "";
            response['own'].forEach((n) => {
                n.update = "";
                if (parseInt(n.version) != this.version) n.update = this.templates.update;
                cards += this.templates.card.render(n);
            });
            if (response['share'].length > 0) {
                var cards = cards + this.templates.divider.format('Shared');
                for (var i = 0; i < response['share'].length; i++) {
                    var MAC = response['share'][i]['mac'];
                    var name = response['share'][i]['name'];
                    var update = this.templates.update;
                    if (parseInt(response['share'][i]['version']) == this.version) {
                        update = "";
                    }
                    cards += this.templates.card.render({
                        update: update,
                        name: name,
                        MAC: MAC
                    });
                }
            }
            tools.draw(this.templates.grid.format(cards));
            this.updateCards(response['own']);
            this.updateCards(response['share']);
            clearInterval(this.interval);
            this.interval = setInterval(function () {
                control.update();
            }, 1000)
        }.bind(this));
    }

    action(mac, payload) {
        tools.sreq('/control/action', function (status, response) {
            if (status === 200) {
                tools.showSuccess('Command sent');
            } else {
                tools.showFailure(status);
            }
        }.bind(this), { 'mac': mac, 'payload': payload });
    }

    update() {
        tools.sreq('/control/update', function (status, response) {
            if (status === 200) {
                this.updateCards(response);
            } else if (status === 400) {
                tools.showModal('error');
                clearInterval(control.interval);
            }
        }.bind(this));
    }

    updateCards(response) {
        if (!nav.section().includes('control')) return;
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
            if (n.status == "9") html = this.templates.off;
            if (n.status == null) html = '';
            var action = document.getElementById(n.mac + "_action");
            if (action.innerHTML != html) action.innerHTML = html;
        });
        feather.replace();
    }
}


class controlTemplates {
    constructor() {
        this.divider = `
<div class="mdl-cell mdl-cell--12-col">
<div class="hr-sect"><span class="mdl-layout-title">{}</span></div>
</div>
  `;

        this.update = `<button class="mdl-button mdl-js-button mdl-button--raised mdl-button mdl-js-ripple-effect"
                data-upgraded=",MaterialButton,MaterialRipple" style="display: inline; visibility: visible;">
            <i class="material-icons">system_update_alt</i> Update available
            <span class="mdl-button__ripple-container"><span class="mdl-ripple"></span></span></button>`;

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
            <i data-feather="alert-triangle"></i>&nbsp;Board is off
        </div>`;

        this.done = `<div class="alert alert-secondary text-center mb-0" role="alert" >
            <i data-feather="check"></i>&nbsp;Waiting for command
        </div>`;

        this.grid = `<div class="row d-flex justify-content-around">
        {}
        </div>
        `;

        this.card = `<div class="col-sm-4 pb-3">
	<div class="card">
		<img class="card-img-top mb-0" src="/img/off.jpg" id="{{mac}}_status">
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
							<div class="dropdown-menu">
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
nav.modules["control"] = {
    class: function () {
        return control;
    },
    icon: "sliders",
    name: "Control center"
};