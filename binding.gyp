{
  "targets": [
    {
      "target_name": "complex_parser",
      "sources": [ "src/cxx/node_wrap.cc",
                   "src/cxx/node_808.cc",
                   "src/cxx/jt808_pack.cc",
                   "src/cxx/http_parser.cc",
                   "src/cxx/jt808_parser.cc"  ],
      "include_dirs" : [ "<!(node -e \"require('nan')\")" ],
      'conditions': [
        ['OS=="mac"', {
          'libraries': [
            '-liconv'            
          ]
        }]
      ]
    }
  ]
}
