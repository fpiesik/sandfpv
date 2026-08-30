# Flight dynamics tuning procedure

Run these checks with the **Air65 II Racing** preset, a stationary level spawn, and the ACRO debug panel visible. Record desired/actual rates and torque against time where applicable.

1. **Hover:** raise throttle slowly and record the hover point. Expect it in the lower stick range, with considerable reserve.
2. **Punch:** stabilize at hover, command 100% throttle, and verify immediate strong upward acceleration without an instantaneous motor step.
3. **Roll step:** hold 70–100% roll briefly. Actual roll rate should approach desired rate rapidly.
4. **Roll stop:** center roll during a fast roll. Active controller torque should brake rotation promptly; passive drag should not be doing most of the work.
5. **Flip:** command full pitch through one rotation, then center. Initiation and recovery should both be prompt, with no self-leveling.
6. **Direction reversal:** command hard left roll and immediately hard right. The measured rate should cross zero quickly.
7. **Diagonal:** combine roll, pitch, and throttle. Verify stable independent tracking on both rate axes without direct orientation changes.

The automated `FlightDynamics.test.ts` checks the physical thrust derivation, roll-step tracking, and reversal deterministically at 120 Hz. Manual tests remain necessary for transmitter feel and altitude finesse.
