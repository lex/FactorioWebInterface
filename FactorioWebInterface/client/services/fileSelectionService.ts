export class FileSelectionService {
    async getFiles(fileTypes?: string): Promise<File[]> {
        return new Promise((resolve) => {
            let input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;

            if (fileTypes) {
                input.accept = fileTypes;
            }

            let resolved = false;

            let focusHandler: () => void;
            let changeHandler = (() => {
                if (resolved) {
                    return;
                }

                resolved = true;

                let files = [...input.files];

                input.value = '';
                input.removeEventListener('change', changeHandler);
                window.removeEventListener('focus', focusHandler);

                resolve(files);
            });

            focusHandler = (() => {
                setTimeout(changeHandler, 200);
            });

            window.addEventListener('focus', focusHandler);
            input.addEventListener('change', changeHandler);

            input.click();
        });
    }
}