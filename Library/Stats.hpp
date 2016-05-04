#include "defs.h"

struct IpStatMsg
{
  int ident;
  const char* chain;
  const char* desc;
  ulong byteCount = 0;
  ulong packetCount = 0;
};

struct EthStatMsg
{
  uint ident;          //Required for Registration
  const char* interface;      //Required for Registration
  const char* interfaceName;  //Required for Registration
  ulong rxGood = 0;
  ulong rxErrors = 0;
  ulong rxDropped = 0;
  ulong rxOverruns = 0;
  ulong rxFrame = 0;
  ulong txGood = 0;
  ulong txErrors = 0;
  ulong txDropped = 0;
  ulong txOverruns = 0;
  ulong txCarrier = 0;
  ulong txCollisions = 0;
  short status = 3; //enum Status {DOWN = 0; UP = 1;}
};

struct SwitchStatMsg
{
  uint ident;          //Required for Registration
  short stat = 3; //enum Status {DOWN = 0; UP = 1;}
  short dplx = 3; //enum Duplex {FULL = 0; HALF = 1;}
  short spd = 3; //enum Speed {MB10 = 0; MB100 = 1; MB1000 = 2;}
  ulong ingressbytes = 0;
  ulong ingressunicast = 0;
  ulong ingressbroadcast = 0;
  ulong ingressmulticast = 0;
  ulong ingresspause = 0;
  ulong ingressundersize = 0;
  ulong ingressfragments = 0;
  ulong ingressoversize = 0;
  ulong ingressjabber = 0;
  ulong ingressrxerr = 0;
  ulong ingressfcserr = 0;
  ulong egressbytes = 0;
  ulong egressunicast = 0;
  ulong egressbroadcast = 0;
  ulong egressmulticast = 0;
  ulong egresspause = 0;
  ulong egressexcessive = 0;
  ulong egresscollisions = 0;
  ulong egressother = 0;
};



class BaseStat
{
protected:
  NL_Message nlMsg;
  
  ZeroCopyInputStream* raw_input = 0;
  CodedInputStream* coded_input = 0;
  
  int file = 0;
  long totalSize = 0;
  uint nlMsgSize = 0; //current msg size
  
public:
  BaseStat(long int size, const char* path);
  ~BaseStat();
  NlMsg GetNextNlMsg();
  uint GetNlSize();
  uint GetBytesRead();
  long GetFileSize();
};

class IpStat: public BaseStat
{
public:
  IpStat(long int totalSize, const char* file) : BaseStat(totalSize, file){};
  IpStatMsg GetStatMsg(int index);
  uint GetCurrentSize();
};

class EthStat: public BaseStat
{
public:
  EthStat(long int totalSize, const char* file) : BaseStat(totalSize, file){};
  EthStatMsg GetStatMsg(int index);
  uint GetCurrentSize();
};

class SwitchStat: public BaseStat
{
public:
  SwitchStat(long int totalSize, const char* file) : BaseStat(totalSize, file){};
  SwitchStatMsg GetStatMsg(int index);
  uint GetCurrentSize();
};