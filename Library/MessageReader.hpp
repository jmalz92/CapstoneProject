#include "Stats.hpp"

class MsgReader
{
  IpStat* ipStatMsgs = 0;
  EthStat* ethStatMsgs = 0;
  SwitchStat* switchStatMsgs = 0;
  
public:
  MsgReader(const char* path);
  ~MsgReader();
  IpStat* GetIpStat();
  EthStat* GetEthStat();
  SwitchStat* GetSwitchStat();
};