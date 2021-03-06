import Connection from './WebSocket/Connection';
import CommandProcessor from './Command/Processor';
import Interface from './Interface/Interface';
import Navigation from "./Router/Navigation";

import {parentByTagName} from './Util/util';

import Init from './Command/Out/Init';
import SelectMail from './Command/Out/SelectMail';
import RefreshMail from "./Command/Out/RefreshMail";
import GetText from "./Command/Out/GetText";
import GetHtml from "./Command/Out/GetHtml";
import GetHtmlWithoutImages from "./Command/Out/GetHtmlWithoutImages";
import GetSource from './Command/Out/GetSource';
import Delete from "./Command/Out/Delete";

export default class Application {
    constructor() {
        this.connection       = new Connection();
        this.commandProcessor = new CommandProcessor({
            init: this.onInit.bind(this),
            newMail: this.onNewMail.bind(this),
            mailInfo: this.onMailInfo.bind(this),
            refreshInfo: this.onRefreshMailInfo.bind(this),
            text: this.onText.bind(this),
            html: this.onHtml.bind(this),
            htmlWithoutImages: this.onHtmlWithoutImages.bind(this),
            source: this.onSource.bind(this),
            delete: this.onDelete.bind(this),
            deleteNotification: this.onDeleteNotification.bind(this),
            readNotification: this.onReadNotification.bind(this)
        });
        this.gui        = new Interface();
        this.navigation = new Navigation();

        this.addEventListeners();
    }

    run() {
        setTimeout(() => {
            this.connection.connect(this.gui.reconnect.bind(this.gui), () => {
                this.gui.connect();
                this.connection.send(new Init());
                this.navigation.start(this.connection);
            }, this.gui.disconnect.bind(this.gui), this.commandProcessor.process.bind(this.commandProcessor));
        });
    }

    onInit(data) {
        this.gui.setConfig(data.config);
        this.onNewMail(data);
    }

    onNewMail(data) {
        this.gui.addMails(data.mails);
    }

    onMailInfo(data) {
        if (data.info.deleted) {
            this.navigation.resetTitle();
            this.navigation.delete();
            this.gui.reset();

            return;
        }

        this.gui.openMail(data.info);
        this.navigation.openMail(data.info);
    }

    onRefreshMailInfo(data) {
        if (data.info.deleted) {
            this.navigation.resetTitle();
            this.navigation.delete();
            this.gui.reset();

            return;
        }

        this.gui.openMail(data.info);
        this.navigation.setTitle(data.info.subject);
    }

    onText(data) {
        this.gui.openText(data.text);
    }

    onHtml(data) {
        this.gui.openHtml(data.html);
    }

    onHtmlWithoutImages(data) {
        this.gui.openHtmlWithoutImages(data.html);
    }

    onSource(data) {
        this.gui.openSource(data.source);
    }

    onDelete(data) {
        this.gui.delete(data.id);
    }

    onDeleteNotification(data) {
        this.gui.deleteNotification(data.id);
    }

    onReadNotification(data) {
        this.gui.readNotification(data.id);
    }

    addEventListeners() {
        document.querySelector('nav#messages ul').addEventListener('click', (e) => {
            const element = parentByTagName(e.target, 'li');

            if (!element) return;

            this.connection.send(new SelectMail(element.dataset.id));
        });

        document.querySelector('header [data-type="text"]:not(.disabled)').addEventListener('click', (e) => {
            this.connection.send(new GetText(parentByTagName(e.target, 'ul').dataset.id));
        });

        document.querySelector('header [data-type="html"]').addEventListener('click', (e) => {
            if (parentByTagName(e.target, 'li').classList.contains('disabled')) {
                return;
            }

            this.connection.send(new GetHtml(parentByTagName(e.target, 'ul').dataset.id));
        });

        document.querySelector('header [data-type="noimages"]').addEventListener('click', (e) => {
            if (parentByTagName(e.target, 'li').classList.contains('disabled')) {
                return;
            }

            this.connection.send(new GetHtmlWithoutImages(parentByTagName(e.target, 'ul').dataset.id));
        });

        document.querySelector('header [data-type="source"]').addEventListener('click', (e) => {
            this.connection.send(new GetSource(parentByTagName(e.target, 'ul').dataset.id));
        });

        document.querySelector('header [data-type="delete"]').addEventListener('click', (e) => {
            this.connection.send(new Delete(parentByTagName(e.target, 'ul').dataset.id));
        });

        window.addEventListener('popstate', (e) => {
            if (e.state === null || e.state.type === 'home') {
                this.navigation.resetState();
                this.gui.reset();

                return;
            }

            if (this.navigation.isDeleted(e.state.data.id)) {
                this.navigation.resetState();
                this.navigation.delete();
                this.gui.reset();

                return;
            }

            this.connection.send(new RefreshMail(e.state.data.id));
        });
    }
}
