import { Injectable } from '@angular/core'
import { Backup } from '../Models/backup.model'
import { CookieService } from 'ngx-cookie-service'
import { saveAs } from 'file-saver'
import { SnackBarHelperService } from './snack-bar-helper.service'
import { MatSnackBar } from '@angular/material/snack-bar'

@Injectable({
  providedIn: 'root'
})
export class LocalBackupService {

  private VERSION = 1

  constructor (private cookieService: CookieService, private snackBarHelperService: SnackBarHelperService, private snackBar: MatSnackBar) { }

  save (fileName: string = 'owasp_juice_shop') {
    const backup: Backup = { version: this.VERSION }

    backup.scoreBoard = {
      displayedDifficulties: localStorage.getItem('displayedDifficulties') ? JSON.parse(String(localStorage.getItem('displayedDifficulties'))) : undefined,
      showSolvedChallenges: localStorage.getItem('showSolvedChallenges') ? JSON.parse(String(localStorage.getItem('showSolvedChallenges'))) : undefined,
      showDisabledChallenges: localStorage.getItem('showDisabledChallenges') ? JSON.parse(String(localStorage.getItem('showDisabledChallenges'))) : undefined,
      showOnlyTutorialChallenges: localStorage.getItem('showOnlyTutorialChallenges') ? JSON.parse(String(localStorage.getItem('showOnlyTutorialChallenges'))) : undefined,
      displayedChallengeCategories: localStorage.getItem('displayedChallengeCategories') ? JSON.parse(String(localStorage.getItem('displayedChallengeCategories'))) : undefined
    }
    backup.banners = {
      welcomeBannerStatus: this.cookieService.get('welcomebanner_status') ? this.cookieService.get('welcomebanner_status') : undefined,
      cookieConsentStatus: this.cookieService.get('cookieconsent_status') ? this.cookieService.get('cookieconsent_status') : undefined
    }
    backup.language = this.cookieService.get('language') ? this.cookieService.get('language') : undefined
    backup.continueCode = this.cookieService.get('continueCode') ? this.cookieService.get('continueCode') : undefined

    const blob = new Blob([JSON.stringify(backup)], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `${fileName}-${new Date().toISOString().split('T')[0]}.json`)
  }

  restore (backupFile: File) {
    backupFile.text().then((backupData) => {
      const backup: Backup = JSON.parse(backupData)

      if (backup.version === this.VERSION) {
        this.restoreLocalStorage('displayedDifficulties', backup.scoreBoard.displayedDifficulties)
        this.restoreLocalStorage('showSolvedChallenges', backup.scoreBoard.showSolvedChallenges)
        this.restoreLocalStorage('showDisabledChallenges', backup.scoreBoard.showDisabledChallenges)
        this.restoreLocalStorage('showOnlyTutorialChallenges', backup.scoreBoard.showOnlyTutorialChallenges)
        this.restoreLocalStorage('displayedChallengeCategories', backup.scoreBoard.displayedChallengeCategories)
        this.restoreCookie('welcomebanner_status', backup.banners.welcomeBannerStatus)
        this.restoreCookie('cookieconsent_status', backup.banners.cookieConsentStatus)
        this.restoreCookie('language', backup.language)
        this.restoreCookie('continueCode', backup.continueCode)

        let snackBarRef = this.snackBar.open('Backup has been restored from ' + backupFile.name, 'Force page reload', {
          duration: 5000
        })
        snackBarRef.onAction().subscribe(() => {
          location.reload()
        })

      } else {
        this.snackBarHelperService.open('Version ' + backup.version + ' is incompatible with expected version ' + this.VERSION, 'errorBar')
      }
    }).catch((err) => {
      this.snackBarHelperService.open('Backup restore operation failed: ' + err.message, 'errorBar')
    })
  }

  private restoreCookie (cookieName: string, cookieValue: string) {
    if (cookieValue) {
      let expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)
      this.cookieService.set(cookieName, cookieValue, expires, '/')
    } else {
      this.cookieService.delete(cookieName, '/')
    }
  }

  private restoreLocalStorage (propertyName: string, propertyValue: any) {
    if (propertyValue) {
      localStorage.setItem(propertyName, JSON.stringify(propertyValue))
    } else {
      localStorage.removeItem(propertyName)
    }
  }
}
