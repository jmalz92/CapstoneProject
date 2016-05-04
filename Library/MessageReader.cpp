#include "MessageReader.hpp"

using namespace google::protobuf::io;
using namespace std;

ZeroCopyInputStream* raw_input;
CodedInputStream* coded_input;
int fd = -1;

MsgReader::MsgReader(const char* path)
{
  fd = open(path, O_RDONLY);
  long int totalSize = 0;
  std::cout << path << std::endl;
  if (fd >= 0)
  {
    struct stat stbuf;
    if ((fstat(fd, &stbuf) != 0) || (!S_ISREG(stbuf.st_mode)))
    {
      //cerr << "Unable to determine file size" << endl;
    }
    
    totalSize = stbuf.st_size;
    
    uint msgSize = 0;
    raw_input = new FileInputStream(fd);
    coded_input  = new CodedInputStream(raw_input);
    
    NL_Message registerMsg;
    //NL_Message updateMsg;
    
    coded_input->ReadVarint32(&msgSize);
    CodedInputStream::Limit mLimit = coded_input->PushLimit(msgSize);
    registerMsg.ParseFromCodedStream(coded_input);
    coded_input->PopLimit(mLimit);
    
    if(registerMsg.ipstat_size() > 0)
    {
      ipStatMsgs = new IpStat(totalSize, path);
    }
    else if (registerMsg.ethernetstat_size() > 0)
    {
      ethStatMsgs = new EthStat(totalSize, path);
    }
    else if (registerMsg.switchstat_size() > 0)
    {
      switchStatMsgs = new SwitchStat(totalSize, path);
    }
  }
}

IpStat* MsgReader::GetIpStat()
{
  return ipStatMsgs;
}

EthStat* MsgReader::GetEthStat()
{
  return ethStatMsgs;
}

SwitchStat* MsgReader::GetSwitchStat()
{
  return switchStatMsgs;
}

//For some reason a sementation fault happens right at
//the end of the program when the cleanup code runs...
MsgReader::~MsgReader()
{
  //delete raw_input;
  //delete coded_input;
  //close(fd);
}