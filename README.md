# node-nos
> 依赖于官方 nos-node-sdk 包的 nos 命令行工具

## Usage
```
  Usage: cmd [options] [command]


  Options:

    -V, --version         output the version number
    -i, --id [value]      指定桶的access id
    -s, --secret [value]  指定桶的 access secret key
    -b, --bucket [value]  指定桶的名字
    -h, --help            output usage information


  Commands:

    config                         进行 nos 配置
    put <filePath> [key]           上传文件或文件夹
    get <key> [path]               下载文件
    link <key> [expires]           获取 bucket 文件的外链，expires 单位为秒
    ls [prefix] [limit]            列出 bucket 中文件
    rm <key>                       删除文件
    cp <key> <targetKey> [bucket]  复制文件到另一个 bucket 中
    mv <key> <target> [bucket]     移动文件到另一个 bucket 中
```
### config 命令
运行 config 命令配置全局 bucket 配置。
```
nos config
```
如需单个配置某配置项，需要在全局配置后，启动单个配置模式进行配置：
```
nos config -b
nos config -s
nos config -i
```
显示当前全部配置:
```
nos config -a
```
### put 命令
运行 put 命令上传单个文件，参数为文件路径与文件 key， key 可选，如不填则自动根据文件名生成 MD5：
上传文件夹时，key 值会被忽略
```
nos put ./test.js testKey
```
### get 命令
运行 get 命令下载文件，参数为文件 key 与文件保存路径，文件保存路径可选，如不填则为启动命令行的该文件夹下：
```
nos get testKey ./test
```
### link 命令
运行 link 命令获取文件外链， 参数为文件 key 与外链过期时长，时长单位为秒, 默认有效时长为 10 分钟
```
nos link fileKey 60
```
### ls 命令
列出 bucket 中的命令， 默认显示 10 条数据， 
```
nos ls testKeyPrefix 3  // 显示 key 为 testKeyPrefix 为前缀的文件信息，显示显示 3 条
```
### rm 命令
删除 bucket 中指定文件, 命令行中如果需要删除多个，只需空一格再加上其他 kay 即可：
```
nos rm delKey  // 删除单个文件
nos rm delKey1 delKey2 ...  //删除多个文件
```
### cp 命令
复制文件命令， 指定需要复制的文件名与新的文件名，注意前后 key 值不能重复, bucket 可选，不填则默认为当前 bucket:
```
nos cp key newKey
```
### mv 命令
移动文件命令， 指定文件移动到其他地方，需要新的 key 值，前后 key 值需不同，bucket 值可选，不填则为当前 bucket：
```
nos mv key newKey
```

## API
### put
使用流式上传， 返回 request 对象，可直接使用 through2 等 pipe.
### put_stream
使用 nos-node-sdk 封装的流式上传， 传入文件 stream 与文件路径，与文件 key
### put_big_file
使用 nos-node-sdk 封装的大文件分块上传， 传入文件路径， 文件 key
### get
使用 nos-node-sdk 封装的下载接口，传入文件 key 与保存文件路径
### getChunk
使用 nos-node-sdk 封装的流式下载接口，传入需要的文件 key， 返回一个下载文件的流对象。
### ls
使用 nos-node-sdk 封装的文件管理接口， 传入需要查找的文件前缀与列表数量， 列出文件信息列表
### rm
使用 nos-node-sdk 封装的文件删除接口， 传入需要删除的文件 key（字符串或数组），单个传字符串，多个则传字符串数组。
### mv
使用 node-node-sdk 封装的文件移动接口， 传入需要移动的文件 key 值，与移动后的新的 key 值，两个 key 值不能相同。
### copy
使用 node-node-sdk 封装的文件复制接口，传入需要复制的文件 key 值与复制后的新的 key 值，两个 key 值不能相同。
### link
获取文件的下载链接， 传入文件 key 值与 expires 过期时间， 可以获取一个文件下载链接，expires 单位为秒。
## nos-node-sdk issues 记录
1. 官方包 nos-node-sdk 中的 ls 库有 bug， 会导致 prefix 查询无效，bug 原因是在进行 get 查询的时候：查询字符串 path 没有加入 query， 请使用 nos-ndoe-sdk 0.0.3 以上的版本。
2. 官方包中因没有进行回调导致无法获取异常，该 bug 在 nos-node-sdk 0.0.4 版本修复。
