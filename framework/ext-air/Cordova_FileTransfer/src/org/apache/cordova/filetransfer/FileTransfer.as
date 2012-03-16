/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * Copyright (c) 2011, Research In Motion Limited.
 */


package org.apache.cordova.filetransfer {
    import flash.net.NetworkInfo;
    import flash.net.NetworkInterface;
	import flash.events.Event;

    import webworks.extension.DefaultExtension;

    public class FileTransfer extends DefaultExtension{

        private var _jsFunctionCallbackIDs:Array = [];
		private const FEATURE_ID:Array = [ "org.apache.cordova" ];

		public function FileTransfer() {
			//Attach event listener once only
            var req:URLRequest = new URLRequest(url);
            stream = new URLStream();
            stream.addEventListener(Event.COMPLETE, writeAirFile);
            stream.load(req);
		}

		override public function getFeatureList():Array {
			return FEATURE_ID;
		}

        public function download(param:String):void{
			if(_jsFunctionCallbackIDs.indexOf(param) < 0){
				_jsFunctionCallbackIDs.push(param);
			}
        }
        private function writeAirFile(evt:Event):void {
            var data:ByteArray = new ByteArray();
            stream.readBytes(fileData,0,stream.bytesAvailable);
            var file:File = File.documentsDirectory.resolvePath("bla.pdf");
            var fileStream:FileStream = new FileStream();
            fileStream.open(file, FileMode.WRITE);
            fileStream.writeBytes(fileData,0,fileData.length);
            fileStream.close();
        }

        private function networkChange( event: Event ) : void {

            /**
             * Right now, we only care if there is a connection or not, since PlayBook only has WiFi
             * At the JS layer, we will map this from offline/online.
             * At some point in the future where there are more connection types on PlayBook,
             * we will want to attempt to map this to the real Cordova connection types...
             */

            var haveCoverage : Boolean = false;
            var networkStatus : String = "offline";
			var connectionType = "none";

			NetworkInfo.networkInfo.findInterfaces().some(
				function callback(item:NetworkInterface, index:int, vector:Vector.<NetworkInterface>):Boolean {
					this.webView.executeJavaScript("alert('Network Interface ' + item.name)");
					haveCoverage = item.active || haveCoverage;
					return haveCoverage;
				}, this);

			if (haveCoverage) {
				networkStatus = "online";
				connectionType = "wifi";
			}

            for (var i:Number=0; i<_jsFunctionCallbackIDs.length ; i++){
                evalJavaScriptEvent(_jsFunctionCallbackIDs[i], [{"type" : connectionType, "event" : networkStatus }] );
            }
        }
    }
}
