class Control {
    constructor() {
        this.templates = new controlTemplates();
        this.getCards();
        this.version = 5;
    }

    action(MAC, payload) {
        session.refresh();
        tools.req('/control/action', function (status, response) {
            if (status === 200) {
                tools.snack("Done")
            } else {
                tools.snack("Failed!")
            }
        }.bind(this), { 'mac': MAC, 'payload': payload });
    }

    update() {
        tools.req('/control/update', function (status, response) {
            if (status === 200) {
                this.updateCards(response);
            } else if (status === 401) {
                clearInterval(tools.interval);
            } else {
                tools.snack("No internet");
            }
        }.bind(this));
    }

    getCards() {
        tools.showLoading("data");
        tools.req('/control/list', function (status, response) {
            if (status === 200) {
                var cards = "";
                //this.cluster = [];
                for (var i = 0; i < response['own'].length; i++) {
                    var MAC = response['own'][i]['mac'];
                    var name = response['own'][i]['name'];
                    var update = this.templates.update;
                    if (parseInt(response['own'][i]['version']) == this.version) {
                        update = "";
                    }
                    //if (response['own'][i]['cluster'] == "1") this.cluster.push(MAC);
                    cards = cards + this.templates.card.format(MAC, MAC, MAC, MAC, update, name, MAC, MAC, MAC, MAC, MAC, MAC, MAC, MAC, MAC);

                }
                if (response['share'].length > 0) {
                    var cards = cards + this.templates.divider.format('Shared');
                    for (var i = 0; i < response['share'].length; i++) {
                        var MAC = response['share'][i]['mac'];
                        var name = response['share'][i]['name'];
                        var update = this.templates.update;
                        if (parseInt(response['share'][i]['version']) == this.version) {
                            update = "";
                        }
                        cards = cards + this.templates.card.format(MAC, MAC, MAC, MAC, update, name, MAC, MAC, MAC, MAC, MAC, MAC, MAC, MAC, MAC);
                    }
                }
                /*if(this.cluster.length > 0){
                    var MAC = 'cluster';
                    var name = 'Combined boards';
                    cards = this.templates.card.format(MAC, MAC, MAC, MAC, name, MAC, MAC, MAC, MAC, MAC, MAC, MAC, MAC, MAC) + cards;
                }*/
                document.getElementById("grid").innerHTML = cards;
                tools.updateMDL();
                this.updateCards(response['own']);
                this.updateCards(response['share']);
                this.update();
                tools.interval = setInterval(active.update.bind(this), 1000);
                tools.hideDiag();
            } else {
                tools.hideDiag();
            }
        }.bind(this));
    }

    updateCards(response) {
        var boardStatus = {
            null: 'url(/img/papelito.png)',
            "0": 'url(/img/off.jpg)',
            "1": 'url(/img/on.jpg)',
            "2": 'url(/img/suspended.gif)',
            "7": 'url(/img/updating.gif)',
            "8": 'url(/img/recovery.jpg',
            "9": 'url(/img/boardoff.png)'
        };
        var boardAction = {
            null: '/done',
            "0": '/waiting',
            "1": '/waiting',
            "2": '/waiting',
            "3": '/on',
            "4": '/turning',
            "5": '/error',
            "6": '/done',
            "7": '/waiting',
            "8": '/waiting',
            "9": '/waiting'
        };
        var actions = Object.keys(boardAction);
        for (var i = 0; i < response.length; i++) {
            try {
                document.getElementById(response[i].mac).style.backgroundImage = boardStatus[response[i].status];
            } catch (error) {
                document.getElementById(response[i].mac).style.backgroundImage = 'url(/img/papelito.png)';
            }
            tools.hide(response[i].mac + '/error');
            tools.hide(response[i].mac + '/on');
            tools.hide(response[i].mac + '/done');
            tools.hide(response[i].mac + '/waiting');
            tools.hide(response[i].mac + '/turning');
            if (response[i].status != '9' && response[i].status != null) {
                tools.show(response[i].mac + boardAction[response[i].action]);
            }
        }
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

        this.card = `<div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">
    <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
        <div id="{}" class="on mdl-card--expand mdl-color--teal-300"
             style="background-image: url('img/off.jpg');"></div>
        <button id="{}/error"
                class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-js-ripple-effect"
                data-upgraded=",MaterialButton,MaterialRipple" style="display: none; visibility: visible;">
            <i class="material-icons">warning</i>Action has not been completed
            <span class="mdl-button__ripple-container"><span class="mdl-ripple"></span></span></button>
        <button id="{}/on" class="mdl-button mdl-js-button mdl-button--raised mdl-button mdl-js-ripple-effect"
                data-upgraded=",MaterialButton,MaterialRipple" style="display: none;">
            <i class="material-icons">offline_bolt</i> Keep on is enabled
            <span class="mdl-button__ripple-container"><span class="mdl-ripple"></span></span></button>
        <button id="{}/done" class="mdl-button mdl-js-button mdl-button--raised mdl-button mdl-js-ripple-effect"
                data-upgraded=",MaterialButton,MaterialRipple" style="display: inline; visibility: visible;">
            <i class="material-icons">done</i> Waiting for command
            <span class="mdl-button__ripple-container"><span class="mdl-ripple"></span></span></button>
            
        {}

        <div class="mdl-card__supporting-text mdl-color-text--grey-600">{} ({})</div>

        <div id="{}/waiting" style="display: none;">
            <div class="mdl-card__supporting-text mdl-color-text--grey-600">
                <center>
                    <bold>Waiting for response...</bold>
                </center>
            </div>
            <div class="mdl-progress mdl-js-progress mdl-progress__indeterminate is-upgraded"
                 data-upgraded=",MaterialProgress">
                <div class="progressbar bar bar1" style="width: 0%;"></div>
                <div class="bufferbar bar bar2" style="width: 100%;"></div>
                <div class="auxbar bar bar3" style="width: 0%;"></div>
            </div>
        </div>

        <div id="{}/turning" style="display: none;">
            <div class="mdl-card__supporting-text mdl-color-text--grey-600">
                <center>
                    <bold>Working on it...</bold>
                </center>
            </div>
            <div class="mdl-progress mdl-js-progress mdl-progress__indeterminate is-upgraded"
                 data-upgraded=",MaterialProgress">
                <div class="progressbar bar bar1" style="width: 0%;"></div>
                <div class="bufferbar bar bar2" style="width: 100%;"></div>
                <div class="auxbar bar bar3" style="width: 0%;"></div>
            </div>
        </div>

        <div class="mdl-card__actions mdl-card--border mdl-typography--text-center">
            <button onclick="active.action('{}','0')" class="mdl-button mdl-js-button mdl-button--primary">
                <i class="material-icons">power_settings_new</i></button>

            <button style="right: 5px; position: absolute; display: inline-flex; vertical-align: middle;" id="menu_{}"
                    class="mdl-button mdl-js-button mdl-button--icon">
                <i class="material-icons">more_vert</i>
            </button>

            <ul class="mdl-menu mdl-menu--top-right mdl-js-menu mdl-js-ripple-effect"
                data-mdl-for="menu_{}">
                <li class="mdl-menu__item mdl-js-ripple-effect" onclick="showDialog({
                title: 'Are you sure?',
                text: 'The board needs an active Internet connection and uninterrupted power<br><br><b>Remember</b> -> Reload the page to dismiss the update message',
                positive: {
                title: 'Yes',
                onClick: function (e) {
                active.action('{}', '8');
                }
                },
                negative: {
                title: 'No'
                }
                });" tabindex="-1"
                    data-upgraded=",MaterialRipple"><i class="material-icons"
                                                       style="display: inline-flex; vertical-align: middle;">system_update</i>
                    Update firmware<span class="mdl-menu__item-ripple-container"><span class="mdl-ripple"></span></span></li>
                <li class="mdl-menu__item mdl-js-ripple-effect" onclick="active.action('{}','9')" tabindex="-1"
                    data-upgraded=",MaterialRipple"><i class="material-icons"
                                                       style="display: inline-flex; vertical-align: middle;">av_timer</i>
                    Recovery<span class="mdl-menu__item-ripple-container"><span class="mdl-ripple"></span></span></li>
                <li class="mdl-menu__item mdl-js-ripple-effect" onclick="showDialog({
                title: 'Are you sure?',
                text: 'Forcing the PC to shutdown will cut the power, meaning no data will be saved before.',
                positive: {
                title: 'Yes',
                onClick: function (e) {
                active.action('{}', '1');
                }
                },
                negative: {
                title: 'No'
                }
                });" tabindex="-1" data-upgraded=",MaterialRipple"><i class="material-icons"
                                                                      style="display: inline-flex; vertical-align: middle;">stop</i>
                    Force off<span class="mdl-menu__item-ripple-container"><span class="mdl-ripple"></span></span></li>
            </ul>
        </div>
    </div>
</div>`;
    }
}

