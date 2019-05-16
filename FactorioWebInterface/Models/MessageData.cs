using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public enum MessageType
    {
        Output,
        Wrapper,
        Control,
        Status,
        Discord
    }
    public class MessageData
    {
        public string ServerId { get; set; }
        public MessageType MessageType { get; set; }
        public string Message { get; set; }
    }
}
