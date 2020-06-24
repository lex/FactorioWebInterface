import { VirtualComponent } from "../../components/virtualComponent";
import { ModPackFilesViewModel } from "./modPackFilesViewModel";
import { Collapse } from "../../components/collapse";
import { Table, DateTimeColumn, MultiSelectColumn, ColumnTemplate } from "../../components/table";
import { Utils } from "../../ts/utils";
import { ModPackFileMetaData } from "../servers/serversTypes";
import { ComparatorHelper } from "../../utils/comparatorHelper";
import { StackPanel } from "../../components/stackPanel";
import { Progress } from "../../components/progress";
import { leftIconWithContent, Icon } from "../../components/icon";
import { Button, iconButton } from "../../components/button";
import { Label } from "../../components/label";
import { Select } from "../../components/select";
import { ObservableObjectBindingSource } from "../../utils/bindingSource";

class ModPackFileNameColumn extends ColumnTemplate<ModPackFileMetaData>{
    constructor(modPackFilesViewModel: ModPackFilesViewModel) {
        super();

        this.property = 'Name';

        this.cell = (name: string) => {
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = name;
            link.href = `/admin/mods?handler=file&modPack=${encodeURIComponent(modPackFilesViewModel.selectedModPack)}&fileName=${encodeURIComponent(name)}`;
            link.onclick = event => event.stopPropagation();

            return link;
        }

        this.comparator = ComparatorHelper.buildStringComparatorForProperty(this.property);
    }
}

export class ModPackFilesView extends VirtualComponent {
    constructor(modPackFilesViewModel: ModPackFilesViewModel) {
        super();

        let header = document.createElement('h4');
        modPackFilesViewModel.bind('title', text => header.textContent = text);

        let mainPanel = new StackPanel(StackPanel.direction.column);

        let buttonsPanel = new StackPanel(StackPanel.direction.row);
        buttonsPanel.style.fontSize = '1rem';

        let uploadProgress = new Progress(p => `Uploading (${p.percentText})`);
        uploadProgress.classList.add('overlay');
        modPackFilesViewModel.uploadProgress.subscribe(progress => uploadProgress.value = progress);

        let uploadIcon = leftIconWithContent(Icon.classes.upload, 'Upload Files');

        let uploadButtonContent = document.createElement('div');
        uploadButtonContent.classList.add('button-spacing');
        uploadButtonContent.style.alignSelf = 'flex-start';
        uploadButtonContent.append(uploadIcon, uploadProgress);

        let uploadButton = new Button(uploadButtonContent, Button.classes.link, 'no-spacing')
            .setCommand(modPackFilesViewModel.uploadFilesCommand);

        let downloadProgress = new Progress(p => 'Fetching');
        downloadProgress.classList.add('overlay', Progress.classes.indeterminate);

        let downloadIcon = leftIconWithContent(Icon.classes.upload, 'Get From Mod Portal');

        let downloadButtonContent = document.createElement('div');
        downloadButtonContent.classList.add('button-spacing');
        downloadButtonContent.style.alignSelf = 'flex-start';
        downloadButtonContent.append(downloadIcon, downloadProgress);

        let downloadButton = new Button(downloadButtonContent, Button.classes.link, 'no-spacing')
            .setCommand(modPackFilesViewModel.downloadFilesCommand);

        let deleteButton = iconButton(Icon.classes.trash, 'Delete Files', Button.classes.danger)
            .setCommand(modPackFilesViewModel.deleteFilesCommand);

        let copyButton = iconButton(Icon.classes.clone, 'Copy Files', Button.classes.link)
            .setCommand(modPackFilesViewModel.copyFilesCommand);

        let moveButton = iconButton(Icon.classes.shareSquare, 'Move Files', Button.classes.link)
            .setCommand(modPackFilesViewModel.moveFilesCommand);

        let destinationLabel = new Label();
        destinationLabel.textContent = 'Copy/Move Destination';
        destinationLabel.classList.add('label-text');
        destinationLabel.style.margin = '0.35em 0.5em';

        let destinationSelect = new Select(modPackFilesViewModel.modPacks, item => item.Name)
            .setPlaceholder('No Mod Packs');
        destinationSelect.style.minWidth = '10em';

        buttonsPanel.append(uploadButton, downloadButton, deleteButton, copyButton, moveButton, destinationLabel, destinationSelect);

        let table = new Table(modPackFilesViewModel.files, [
            new MultiSelectColumn(),
            new ModPackFileNameColumn(modPackFilesViewModel),
            new DateTimeColumn('LastModifiedTime')
                .setHeader(() => 'Last Modified Time'),
            { property: 'Size', cell: (value) => Utils.bytesToSize(value) }
        ]);
        table.classList.add('th-min-width-normal');
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.width = '100%';

        let tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.margin = '0 1.5rem 1rem 1.5rem';
        tableContainer.style.lineHeight = '1.5';
        tableContainer.append(table);

        mainPanel.append(buttonsPanel, tableContainer);

        let collapse = new Collapse(header, mainPanel);
        collapse.open = true;
        collapse.classList.add('is-4', 'border', 'header');
        collapse.style.marginTop = '2rem';
        this._root = collapse;

        function updateUploadButton(isUploading: boolean) {
            if (isUploading) {
                uploadProgress.style.visibility = '';
                uploadIcon.style.visibility = 'hidden';
            } else {
                uploadProgress.style.visibility = 'hidden';
                uploadIcon.style.visibility = '';
            }
        }

        function updateDownloadButton(isDeflating: boolean) {
            if (isDeflating) {
                downloadProgress.style.visibility = '';
                downloadIcon.style.visibility = 'hidden';
            } else {
                downloadProgress.style.visibility = 'hidden';
                downloadIcon.style.visibility = '';
            }
        }

        modPackFilesViewModel.isUploading.bind(event => updateUploadButton(event));
        modPackFilesViewModel.isDownloading.bind(event => updateDownloadButton(event));
    }
}