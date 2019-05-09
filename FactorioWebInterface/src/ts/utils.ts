export interface Error {
    Key: string;
    Description: string;
}

export interface Result {
    Success: boolean;
    Errors: Error[];
}

export class Utils {
    private static pad(number) {
        return number < 10 ? '0' + number : number;
    }

    static formatDate(date: Date): string {
        let year = this.pad(date.getUTCFullYear());
        let month = this.pad(date.getUTCMonth() + 1);
        let day = this.pad(date.getUTCDate());
        let hour = this.pad(date.getUTCHours());
        let min = this.pad(date.getUTCMinutes());
        let sec = this.pad(date.getUTCSeconds());
        return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    }
}
