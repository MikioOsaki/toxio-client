import { Component, Inject, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { HazardousSubstance } from '../../interfaces/interfaces';
import { APP_CONFIG } from '../../app/app.config';
import { Settings } from '../../interfaces/interfaces';
import { SELECT_HAZARDOUS_SUBSTANCE_PAGE } from '../pages.constants';
import {
    HazardousSubstanceRepository,
    QRCodeProvider,
    SafetyDataSheetProvider
} from '../../providers/providers';
import { tap } from 'rxjs/operators';
import { SocialSharing } from '@ionic-native/social-sharing';
import { NgxQRCodeComponent } from 'ngx-qrcode2';
import { ActionSheetController } from 'ionic-angular';

/**
 * Generated class for the SingleHazardousSubstancePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-single-hazardous-substance',
    templateUrl: 'single-hazardous-substance.html'
})
export class SingleHazardousSubstancePage {
    @ViewChild(NgxQRCodeComponent) qrcode: NgxQRCodeComponent;
    public hazardousSubstance: HazardousSubstance;
    public qrCodeValue: string;

    constructor(
        @Inject(APP_CONFIG) private appConfig: Settings,
        private platform: Platform,
        private actionSheetController: ActionSheetController,
        private alertController: AlertController,
        public navController: NavController,
        public navParams: NavParams,
        private hazardousSubstanceRepository: HazardousSubstanceRepository,
        private qrCodeProvider: QRCodeProvider,
        private safetyDataSheetProvider: SafetyDataSheetProvider,
        private sharer: SocialSharing
    ) {}

    public openSafetyDataSheet(): void {
        this.safetyDataSheetProvider.openSafetyDataSheet(this.hazardousSubstance);
    }

    public openShareSheet(): void {
        this.actionSheetController
            .create({
                title: `Optionen für ${this.hazardousSubstance.name}`,
                buttons: [
                    {
                        text: 'QR Code Exportieren',
                        icon: !this.platform.is('ios') ? 'share' : null,
                        handler: () => this.exportQRCode()
                    },
                    {
                        text: 'Abbrechen',
                        role: 'cancel',
                        icon: !this.platform.is('ios') ? 'close' : null
                    }
                ]
            })
            .present();
    }

    private exportQRCode(): void {
        this.qrcode
            .toDataURL()
            .then((qrDataUrl: string) => {
                console.log(qrDataUrl);
                this.sharer
                    .share(
                        `QR Code für ${this.hazardousSubstance.name}`,
                        `${this.hazardousSubstance.hsNumber}_qrcode`,
                        qrDataUrl
                    )
                    .then(v => {
                        console.log('Share', v);
                    })
                    .catch(this.informQRCodeExportError);
            })
            .catch(this.informQRCodeExportError);
    }

    private informQRCodeExportError = (e: Error): void => {
        this.alertController
            .create({
                title: 'Oops...',
                subTitle: 'QR Code Export klappt nicht',
                message: e.message,
                buttons: ['meh']
            })
            .present();
    };

    ionViewDidLoad() {
        console.log(
            `ionViewDidLoad SingleHazardousSubstancePage for ${this.hazardousSubstance.name}`
        );
        this.qrCodeValue = this.qrCodeProvider.getValueFor(this.hazardousSubstance);
        console.log(this.qrCodeValue);
    }

    ionViewCanEnter(): boolean | Promise<HazardousSubstance[]> {
        const hazardousSubstance = this.navParams.get('hazardousSubstance');
        if (!hazardousSubstance) {
            if (this.appConfig.debugMode) {
                return this.hazardousSubstanceRepository
                    .all()
                    .pipe(
                        tap(hazardousSubstances => {
                            this.hazardousSubstance = hazardousSubstances.shift();
                        })
                    )
                    .toPromise();
            }

            this.alertController
                .create({
                    title: 'Oops...',
                    subTitle: 'Bitte wählen Sie zuerst einen Gefahrstoff aus!',
                    buttons: [
                        {
                            text: 'Ok',
                            handler: () => {
                                this.navController.push(SELECT_HAZARDOUS_SUBSTANCE_PAGE);
                            }
                        }
                    ]
                })
                .present();
            return false;
        }

        this.hazardousSubstance = hazardousSubstance;

        return true;
    }
}
