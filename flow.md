# Flow and data requirements
## Requirements per type
### Each Test
- Start time of the test (when first stimulus is send)
- Participant ID
- Condition
- Domain
- List of Stimuli (see next section)

### Each Stimulus
- Stimuli ID (s01, s02, ...)
- Start time per stimulus
- List of buttons
- End-time of this stimulus (time of last button press)

### Each Button
- Far (“F”) or Near (“N”) touch screen
- x-y-coordinates of middle of button
- x-y-coordinates on the touch screen
- Time of button press
- Button (“A”, “B”, “C”, or “D”) or no button reaction (“0”) when timed out (5 sec per button)

## Flow
1. Fill in meta data
2. Click on start
3. Audio message “Look at the object in the virtual environment”
4. Audio signal “Beep” (10 sec after audio message)
5. Send button message to far and near monitor
6. Log the response (based on data requirements)
7. Go to step 3 after x amount of seconds
