Inorder to run satellite multiple nodes, first we have to upload a file in insert TLE list through select file and click entire.
Next, in select file, we have to select the file which contains satellite names and rgb values. After we upload, the text area will be updated with
satellite names.

Note: We should not select satellite names in select file without uploading the file in select file. otherwise, it will not have rgb values and does not work properly.

Testing:

We can test it using the files in select dialog.

Files in SelectDialog_Testing:
For insertTLEList: Starlink_20231116160005.txt
For SelectDialog, SelectDialog_Testing2.txt or SelectDialog_Testing1.txt

However, the StarLink file in SelectDialog_Testing contains only very few satellites. Hence, we cannot see all the dots we see in default or the previous version.

If we need to see the dots, we need to test it with a lot of satellites data. There is only small difference.

We need to insert the satellite file from data instead of select dialog.

Files required are:

For insertTLEList: Data/SelectDialog_Testing2.txt. // from data directory.
For SelectDialog, SelectDialog_Testing2.txt or SelectDialog_Testing1.txt. // same as before.
