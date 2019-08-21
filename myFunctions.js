/*********************************************************************************
//
//	共通で使用する関数とか
//
*********************************************************************************/
const	fs = require('fs');
const	path = require('path');

module.exports = {
	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	ファイルの中身を読み込んで返す
	// @param [in] ファイルパス
	// @return [out] ファイルの中身
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	fread : function (filePath){
		let buffer = new String();

		if ( !this.isExist(filePath) ){								//	ファイルがなかったら
			return false;											//	falseを返す
		}

		try{
			buffer = fs.readFileSync(filePath, 'utf8');
		}
		catch(err){
//			console.log("Error!! open: " + filePath);
//			console.log(err);
			buffer = false
		}
		return buffer
	},//function fread


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	ファイルへ文字列を書き込む（"w"モード。追記しない）
	// @param [in] filePath ファイルパス, outString 出力文字列
	// @return [out] ????
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	fwrite : function (filePath, outString){

		try{
			fs.writeFileSync(filePath, outString);
		}
		catch ( err ){
			console.log( err );
		}
	},


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	ファイルへ文字列を書き込む（"a"モード。追記する）
	// @param [in] filePath ファイルパス、outString 出力文字列
	// @return [out] ????
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	append : function (filePath, outString){

		if ( !this.isExist(filePath) ){			//	書き込み先のファイルがない
			//return false;						//	存在しないときも書いていい気がする
		}

		fs.appendFile(filePath, outString, function(err){
			if ( err ){
				throw err;
			}
		});
	},


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	ファイルの有無(true/false)を返す
	// @param [in] ファイル名
	// @return [out] true:ある、false:ない
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	isExist : function (filePath) {
		let exist = false;
		try {
			fs.statSync(filePath);
			return true;						//	ファイルがある
		}
		catch ( err ){
			if ( err.code === 'ENOENT' ){
				return false;					//	ファイルがない
			}
			else{
				console.log("Exception Error! : " + err );
			}
		}
	},


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	実行ファイルの名称を返す
	// @param [in] なし
	// @return [out] ファイル名称
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	appName : function(){
		return path.basename( process.argv[1]);
	},


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	PIDファイル名を返す
	// @param [in] PIDファイル出力先ディレクトリ
	// @return [out] 
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	pidFile : function ( dirName ){
		const pid_path = dirName + "/" + this.appName() + ".pid";
		return pid_path;
	},


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	実行されたファイル名に.pid拡張子を付与して、そのファイルの中にpid情報を格納する
	// @param [in] PIDファイル出力先ディレクトリ
	// @return [out] 
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	mkpid : function( dirName ){
		const pid_path = this.pidFile( dirName );
		let result = 0;

		if ( !this.isExist( pid_path ) ){					//	ファイルが存在する場合は
			this.fwrite( pid_path, process.pid);
			result = pid_path;
		}

		return result;
	},


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	PIDファイルを削除する
	// @param [in] PIDファイル出力先ディレクトリ
	// @return [out] 削除できたらtrue
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	rmpid : function ( dirName ) {
		let result = false;
		const pid_path = this.pidFile( dirName );

		if ( !this.isExist( pid_path) ){				//	消せといわれてもファイルがない
			return false;
		}

		try{
			fs.unlinkSync( pid_path );
			result = true;				//	削除できた♪
		}
		catch(err){
			throw err;
		}

		return result;
	},//function rmpid( dirName)


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	設定ファイルを読み込む（設定の妥当性は見ない）
	// @param [in] 設定ファイルのパス（key=value、形式の文字列が入ったファイル）
	// @return [out] 連想配列
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	loadConfig : function( filePath ){
		let ret = {};									//	戻り値（配列）の初期化

		const contents = this.fread(filePath);			//	ファイル全読み
		const line_array = contents.split("\n");		//	LFコードで分割

		for(let i=0; i < line_array.length; i++){		//	1行ずつ確認
			let comment = "";
			let line = "";
			let tmp = "";
			let key = "", val="";

			if ( line_array[i] === undefined ){			//	undefinedだったら無視
				continue;
			}

			line = line_array[i].trim();				//	行末のCRコードを削除

			if ( !line.length ){						//	空行だったら無視
			 	continue;
			}

			comment = line.match(/^;/);					//	先頭の;はコメント行とみなす
			if ( comment != null ) {					//	コメント行は無視
				continue;
			}

			comment = line.match(/^#/);					//	先頭の#はコメント行とみなす
			if ( comment != null ) {					//	コメント行は無視
				continue;
			}


			comment = line.match(/^\/\//);				//	先頭の//はラインコメントとみなす
			if ( comment != null ) {					//	コメント行は無視
				continue;
			}


			tmp = line.split('=');						//	区切り文字
			if ( tmp.length < 2 ){						//	が無かったら無視
				continue;
			}

			//	key&valueのそれぞれの行頭、行末から空白文字を削除する
			tmp[0] = tmp[0].replace(/^\s+|\s+$/g,'');	//	keyの行頭＆行末
			tmp[1] = tmp[1].replace(/^\s+/g,'');		//	valueの行頭
			tmp[tmp.length-1] = tmp[tmp.length-1].replace(/\s+$/g,'');	//	valueの行末

			key = tmp.shift();							//	key確定＆配列要素からkey部分を削除
			val = tmp.join('=');						//	=を複数含んでた可能性があるので=文字で再連結

			ret[key] = val;								//	連想配列にデータをセット
		}//for

		return ret;										//	連想配列を返す
	},//function loadConfig


	/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//
	// @brief	設定ファイルを保存	この機能要るか？
	// @param [in] filePath : 設定ファイルのパス, configArray : 設定情報を含む連想配列
	// @return [out] ???
	//
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
	saveConfig : function (filePath, configArray ){
		console.log("未実装");
		return 0;
	}//function saveConfig
};
//EOF
