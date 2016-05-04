#include "MessageReader.hpp"
#include <iostream>
#include <chrono>
#include <thread>

int main(int argc, char* argv[])
{
   if(argc == 2)
   {
      MsgReader reader(argv[1]);
      
      if (reader.GetIpStat())
      {
	std::cout << "File is IpStat log" << std::endl;
	do
	{
	  NlMsg aNlMsg = reader.GetIpStat()->GetNextNlMsg();
	  std::cout << "num of stats: " << reader.GetIpStat()->GetCurrentSize()
		    << "  source: " << aNlMsg.source 
		    << "  command: " << aNlMsg.command << std::endl;
	  std::cin.get();
	  for (int i = 0; i < reader.GetIpStat()->GetCurrentSize(); i++)
	  {
	    IpStatMsg aMsg = reader.GetIpStat()->GetStatMsg(i);
	    std::cout << aMsg.desc << std::endl;
	    std::this_thread::sleep_for(std::chrono::milliseconds(50));
	  }
	} while (reader.GetIpStat()->GetBytesRead() < reader.GetIpStat()->GetFileSize());
      }
      else if (reader.GetEthStat())
      {
	std::cout << "File is EthernetStat log" << std::endl;
	do
	{
	  NlMsg aNlMsg = reader.GetEthStat()->GetNextNlMsg();
	  std::cout << reader.GetEthStat()->GetNlSize() << std::endl;
	  std::cout << "num of stats: " << reader.GetEthStat()->GetCurrentSize()
		    << "  source: " << aNlMsg.source 
		    << "  command: " << aNlMsg.command << std::endl;
	  std::cin.get();
	  for (int i = 0; i < reader.GetEthStat()->GetCurrentSize(); i++)
	  {
	    EthStatMsg aMsg = reader.GetEthStat()->GetStatMsg(i);
	    std::cout << aMsg.interface << std::endl;
	    std::this_thread::sleep_for(std::chrono::milliseconds(50));
	  }
	} while (reader.GetEthStat()->GetBytesRead() < reader.GetEthStat()->GetFileSize());
      }
      else if (reader.GetSwitchStat())
      {
	std::cout << "File is SwitchStat log" << std::endl;
	do
	{
	  NlMsg aNlMsg = reader.GetSwitchStat()->GetNextNlMsg();
	  std::cout << "num of stats: " << reader.GetSwitchStat()->GetCurrentSize()
		    << "  source: " << aNlMsg.source 
		    << "  command: " << aNlMsg.command << std::endl;
	  std::cin.get();
	  for (int i = 0; i < reader.GetSwitchStat()->GetCurrentSize(); i++)
	  {
	    //std::cout << aMsg.ident << std::endl;
	    SwitchStatMsg aMsg = reader.GetSwitchStat()->GetStatMsg(i);
	    std::cout << "ident: " << aMsg.ident << std::endl;
	    std::this_thread::sleep_for(std::chrono::milliseconds(50));
	  }
	} while (reader.GetSwitchStat()->GetBytesRead() < reader.GetSwitchStat()->GetFileSize());
      }
      
      return 0;
   }
   else
   {
      std::cout << "Usage: <path to raw file>" << std::endl;
      return 1;
   }
}