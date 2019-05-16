export interface Error {
    Key: string;
    Description: string;
}

export interface Result<T = void> {
    Success: boolean;
    Errors: Error[];
    Value: T;
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

    private static sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    static bytesToSize(bytes: number) {
        // https://gist.github.com/lanqy/5193417

        if (bytes === 0)
            return 'n/a';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        if (i === 0)
            return `${bytes} ${this.sizes[i]}`;
        else
            return `${(bytes / (1024 ** i)).toFixed(1)} ${this.sizes[i]}`;
    }
}
