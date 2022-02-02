# EHC Tool

Eye hand coordination test tool

Sometimes Windows does not understand what touchscreen should provide input on what screen, so follow this link to get instructions on how to set this up. [dual touchscreen settings Windows](https://support.ctouch.eu/hc/en-us/articles/115003949829-How-can-I-setup-multiple-touch-screens-in-Windows-10-)
Short: Control Panel -> Hardware and Sound -> Tablet PC Settings -> Setup...
## Installation instructions

Install the dependencies in each package folder using:

```bash
npm i
```

Finally, run the GUI and admin server in the demo-tool and gui package folders using:

```bash
npm start
```

And visit [http://localhost:1234](http://localhost:1234) to open the ehc test window.
And visit [http://localhost:3000](http://localhost:3000) to open the ehc admin window.
