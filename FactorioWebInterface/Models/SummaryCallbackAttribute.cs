using System;

namespace FactorioWebInterface.Models
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method | AttributeTargets.Parameter, AllowMultiple = false, Inherited = true)]
    public class SummaryCallbackAttribute : Attribute
    {
        public Type Type { get; }

        public SummaryCallbackAttribute(Type type)
        {
            Type = type;
        }
    }
}
