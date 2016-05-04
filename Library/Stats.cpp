#include "Stats.hpp"

IpStatMsg IpStat::GetStatMsg(int index)
{
  IpStatMsg msg;
  if (nlMsg.IsInitialized() && index < nlMsg.ipstat_size())
  {
    msg.ident = nlMsg.ipstat(index).ident();
    msg.chain = nlMsg.ipstat(index).chain().c_str();
    if (nlMsg.ipstat(index).has_desc())
    {
      msg.desc = nlMsg.ipstat(index).desc().c_str();
    }
    if (nlMsg.ipstat(index).has_bytecount() && nlMsg.ipstat(index).has_packetcount())
    {
      msg.byteCount = nlMsg.ipstat(index).bytecount();
      msg.packetCount = nlMsg.ipstat(index).packetcount();
    }
  }
  return msg;
}

uint IpStat::GetCurrentSize()
{
  return nlMsg.ipstat_size();
}


//ETHSTAT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

EthStatMsg EthStat::GetStatMsg(int index)
{
  EthStatMsg msg;
  if (nlMsg.IsInitialized() && index < nlMsg.ethernetstat_size())
  {
    msg.ident = nlMsg.ethernetstat(index).ident();
    if (nlMsg.ethernetstat(index).has_interface())
      msg.interface = nlMsg.ethernetstat(index).interface().c_str();
    if (nlMsg.ethernetstat(index).has_interfacename())
      msg.interfaceName = nlMsg.ethernetstat(index).interfacename().c_str();
    if (nlMsg.ethernetstat(index).has_rxgood())
      msg.rxGood = nlMsg.ethernetstat(index).rxgood();
    if (nlMsg.ethernetstat(index).has_rxerrors())
      msg.rxErrors = nlMsg.ethernetstat(index).rxerrors();
    if (nlMsg.ethernetstat(index).has_rxdropped())
      msg.rxDropped = nlMsg.ethernetstat(index).rxdropped();
    if (nlMsg.ethernetstat(index).has_rxoverruns())
      msg.rxOverruns = nlMsg.ethernetstat(index).rxoverruns();
    if (nlMsg.ethernetstat(index).has_rxframe())
      msg.rxFrame = nlMsg.ethernetstat(index).rxframe();
    if (nlMsg.ethernetstat(index).has_txgood())
      msg.txGood = nlMsg.ethernetstat(index).txgood();
    if (nlMsg.ethernetstat(index).has_txerrors())
      msg.txErrors = nlMsg.ethernetstat(index).txerrors();
    if (nlMsg.ethernetstat(index).has_txdropped())
      msg.txDropped = nlMsg.ethernetstat(index).txdropped();
    if (nlMsg.ethernetstat(index).has_txoverruns())
      msg.txOverruns = nlMsg.ethernetstat(index).txoverruns();
    if (nlMsg.ethernetstat(index).has_txcarrier())
      msg.txCarrier = nlMsg.ethernetstat(index).txcarrier();
    if (nlMsg.ethernetstat(index).has_txcollisions())
      msg.txCollisions = nlMsg.ethernetstat(index).txcollisions();
    if (nlMsg.ethernetstat(index).has_status())
      msg.status = nlMsg.ethernetstat(index).status();
  }
  return msg;
}

uint EthStat::GetCurrentSize()
{
  return nlMsg.ethernetstat_size();
}


//SWITCHSTAT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

SwitchStatMsg SwitchStat::GetStatMsg(int index)
{
  SwitchStatMsg msg;
  if (nlMsg.IsInitialized() && index < nlMsg.switchstat_size())
  {
    msg.ident = nlMsg.switchstat(index).ident();
    if (nlMsg.switchstat(index).has_stat())
      msg.stat = nlMsg.switchstat(index).stat();
    if (nlMsg.switchstat(index).has_dplx())
      msg.dplx = nlMsg.switchstat(index).dplx();
    if (nlMsg.switchstat(index).has_spd())
      msg.spd = nlMsg.switchstat(index).spd();
    if (nlMsg.switchstat(index).has_ingressbytes())
      msg.ingressbytes = nlMsg.switchstat(index).ingressbytes();
    if (nlMsg.switchstat(index).has_ingressunicast())
      msg.ingressunicast = nlMsg.switchstat(index).ingressunicast();
    if (nlMsg.switchstat(index).has_ingressbroadcast())
      msg.ingressbroadcast = nlMsg.switchstat(index).ingressbroadcast();
    if (nlMsg.switchstat(index).has_ingressmulticast())
      msg.ingressmulticast = nlMsg.switchstat(index).ingressmulticast();
    if (nlMsg.switchstat(index).has_ingresspause())
      msg.ingresspause = nlMsg.switchstat(index).ingresspause();
    if (nlMsg.switchstat(index).has_ingressundersize())
      msg.ingressundersize = nlMsg.switchstat(index).ingressundersize();
    if (nlMsg.switchstat(index).has_ingressfragments())
      msg.ingressfragments = nlMsg.switchstat(index).ingressfragments();
    if (nlMsg.switchstat(index).has_ingressoversize())
      msg.ingressoversize = nlMsg.switchstat(index).ingressoversize();
    if (nlMsg.switchstat(index).has_ingressjabber())
      msg.ingressjabber = nlMsg.switchstat(index).ingressjabber();
    if (nlMsg.switchstat(index).has_ingressrxerr())
      msg.ingressrxerr = nlMsg.switchstat(index).ingressrxerr();
    if (nlMsg.switchstat(index).has_ingressfcserr())
      msg.ingressfcserr = nlMsg.switchstat(index).ingressfcserr();
    if (nlMsg.switchstat(index).has_egressbytes())
      msg.egressbytes = nlMsg.switchstat(index).egressbytes();
    if (nlMsg.switchstat(index).has_egressunicast())
      msg.egressunicast = nlMsg.switchstat(index).egressunicast();
    if (nlMsg.switchstat(index).has_egressbroadcast())
      msg.egressbroadcast = nlMsg.switchstat(index).egressbroadcast();
    if (nlMsg.switchstat(index).has_egressmulticast())
      msg.egressmulticast = nlMsg.switchstat(index).egressmulticast();
    if (nlMsg.switchstat(index).has_egresspause())
      msg.egresspause = nlMsg.switchstat(index).egresspause();
    if (nlMsg.switchstat(index).has_egressexcessive())
      msg.egressexcessive = nlMsg.switchstat(index).egressexcessive();
    if (nlMsg.switchstat(index).has_egresscollisions())
      msg.egresscollisions = nlMsg.switchstat(index).egresscollisions();
    if (nlMsg.switchstat(index).has_egressother())
      msg.egressother = nlMsg.switchstat(index).egressother();
  }
  return msg;
}

uint SwitchStat::GetCurrentSize()
{
  return nlMsg.switchstat_size();
}


//BASESTAT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

BaseStat::BaseStat(long int size, const char* path)
{
  file = open(path, O_RDONLY);
  totalSize = size;
  raw_input = new FileInputStream(file);
  coded_input = new CodedInputStream(raw_input);
}

NlMsg BaseStat::GetNextNlMsg()
{
  NlMsg msg;
  if (coded_input->ReadVarint32(&nlMsgSize))//HasNextNlMsg() checks for a msg already but someone might forget
  {
    CodedInputStream::Limit mLimit = coded_input->PushLimit(nlMsgSize);
    //std::cout << "nlMsgSize: " << nlMsgSize << std::endl;
    const void* data;
    int remainingBufferSize = 0;
    if(coded_input->GetDirectBufferPointer(&data, &remainingBufferSize))
    {
      //std::cout << "nlMsgSize: " << nlMsgSize << std::endl;
      if(totalSize == raw_input->ByteCount())
      {
	std::cout << "eof" << std::endl;
	std::cin.get();
	if (nlMsgSize > remainingBufferSize)
	  std::cout << "partial msg" << std::endl;
      }
      else
      {
	nlMsg.ParseFromCodedStream(coded_input);
	coded_input->PopLimit(mLimit);
	msg.source = nlMsg.source();
	msg.command = nlMsg.command();
	if (nlMsg.has_switchstatnetwork())
	{
	  msg.switchStatNetwork = nlMsg.switchstatnetwork();
	}
      }
    }
  }
  return msg;
}

uint BaseStat::GetNlSize()
{
  return nlMsgSize;
}

uint BaseStat::GetBytesRead()
{
  return raw_input->ByteCount();
}

long BaseStat::GetFileSize()
{
  return totalSize;
}

BaseStat::~BaseStat()
{
  close(file);
} 
