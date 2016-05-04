// system includes
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <fstream>
#include <iomanip>

// protobuf lib includes
#include <google/protobuf/io/zero_copy_stream_impl.h>
#include <google/protobuf/io/coded_stream.h>

// app includes
#include "PBNetStat.pb.h"

using namespace google::protobuf::io;

//-3 means na
struct NlMsg
{
  short source = -3; //enum Source  { IO = 0; ADS = 1; EFB = 2; COMM = 3; INVALID = -1;};
  short command = -3; //enum Command { REGISTER = 0; REGISTER_REQUEST = 1; UPDATE = 2; UPDATE_REQUEST = 3; CLEAR = 4;};
  short switchStatNetwork = -3; //enum Network { EDN = 0; IDN = 1; };
};