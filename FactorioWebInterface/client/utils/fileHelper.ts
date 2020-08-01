export class FileHelper {
    static enusreExtension(name: string, extension: string): string {
        if (name.endsWith(extension)) {
            return name;
        } else {
            return name + extension;
        }
    }
}