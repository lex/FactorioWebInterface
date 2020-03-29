using System;

namespace FactorioWebInterface.Models
{
    public enum GetModDownloadResultStatus
    {
        Success,
        InvalidModName,
        InvalidHttpResponse,
        InvalidReleaseData,
        MissingMod,
        MissingVersion
    }

    public class GetModDownloadResult
    {
        public string FileName { get; }
        public GetModDownloadResultStatus Status { get; }
        public string? DownloadUrl { get; }

        private GetModDownloadResult(string fileName, GetModDownloadResultStatus status, string? downloadUrl)
        {
            FileName = fileName;
            Status = status;
            DownloadUrl = downloadUrl;
        }

        public static GetModDownloadResult Success(string fileName, string downloadUrl)
        {
            return new GetModDownloadResult(fileName, GetModDownloadResultStatus.Success, downloadUrl);
        }

        public static GetModDownloadResult Failure(string fileName, GetModDownloadResultStatus status)
        {
            if (status == GetModDownloadResultStatus.Success)
            {
                throw new ArgumentException(nameof(status));
            }

            return new GetModDownloadResult(fileName, status, null);
        }
    }
}
