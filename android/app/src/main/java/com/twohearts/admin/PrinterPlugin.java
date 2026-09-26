package com.twohearts.admin;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.OutputStream;
import java.lang.reflect.Method;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "PrinterPlugin",
    permissions = {
        @Permission(
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN
            },
            alias = "bluetooth"
        )
    }
)
public class PrinterPlugin extends Plugin {
    private static final String TAG = "PrinterPlugin";
    // Standard SPP (Serial Port Profile) UUID for ESC/POS receipt printers
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothAdapter getAdapter() {
        return BluetoothAdapter.getDefaultAdapter();
    }

    private boolean hasBluetoothPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    @PluginMethod
    public void isBluetoothEnabled(PluginCall call) {
        BluetoothAdapter adapter = getAdapter();
        JSObject ret = new JSObject();
        if (adapter == null) {
            ret.put("supported", false);
            ret.put("enabled", false);
        } else {
            ret.put("supported", true);
            ret.put("enabled", adapter.isEnabled());
        }
        ret.put("hasPermission", hasBluetoothPermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void getPairedPrinters(PluginCall call) {
        if (!hasBluetoothPermission()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                requestPermissionForAlias("bluetooth", call, "pairedPrintersCallback");
                return;
            }
        }
        fetchPairedPrinters(call);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void pairedPrintersCallback(PluginCall call) {
        if (hasBluetoothPermission()) {
            fetchPairedPrinters(call);
        } else {
            call.reject("Bluetooth permission was denied. Please allow Nearby Devices permission in Settings.");
        }
    }

    private void fetchPairedPrinters(PluginCall call) {
        BluetoothAdapter adapter = getAdapter();
        if (adapter == null) {
            call.reject("Bluetooth is not supported on this device");
            return;
        }

        if (!adapter.isEnabled()) {
            call.reject("Bluetooth is turned off. Please turn on Bluetooth in device settings.");
            return;
        }

        try {
            Set<BluetoothDevice> pairedDevices = adapter.getBondedDevices();
            JSArray devicesArray = new JSArray();

            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    JSObject devObj = new JSObject();
                    String name = device.getName();
                    String address = device.getAddress();
                    devObj.put("name", name != null ? name : "Unknown Device");
                    devObj.put("address", address);
                    
                    // Helper flag for thermal printers
                    boolean isLikelyPrinter = false;
                    if (name != null) {
                        String lower = name.toLowerCase();
                        if (lower.contains("print") || lower.contains("pos") || lower.contains("ec") ||
                            lower.contains("rpp") || lower.contains("mpt") || lower.contains("inner") ||
                            lower.contains("58") || lower.contains("80") || lower.contains("bt-") ||
                            lower.contains("everycom")) {
                            isLikelyPrinter = true;
                        }
                    }
                    devObj.put("isLikelyPrinter", isLikelyPrinter);
                    devicesArray.put(devObj);
                }
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("devices", devicesArray);
            call.resolve(result);
        } catch (SecurityException se) {
            call.reject("Bluetooth security permission required: " + se.getMessage());
        } catch (Exception e) {
            call.reject("Error fetching paired Bluetooth devices: " + e.getMessage());
        }
    }

    @PluginMethod
    public void testConnection(PluginCall call) {
        final String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Printer MAC address is required");
            return;
        }

        getBridge().execute(() -> {
            BluetoothAdapter adapter = getAdapter();
            if (adapter == null || !adapter.isEnabled()) {
                call.reject("Bluetooth is off or not supported");
                return;
            }

            BluetoothSocket socket = null;
            try {
                BluetoothDevice device = adapter.getRemoteDevice(address);
                adapter.cancelDiscovery();

                try {
                    socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                    socket.connect();
                } catch (Exception connectEx) {
                    // Reflection fallback port 1
                    Method m = device.getClass().getMethod("createRfcommSocket", new Class[]{int.class});
                    socket = (BluetoothSocket) m.invoke(device, 1);
                    socket.connect();
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("connected", true);
                ret.put("message", "Successfully connected to " + device.getName());
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Connection test failed", e);
                call.reject("Could not connect to printer (" + address + "): " + e.getMessage());
            } finally {
                if (socket != null) {
                    try {
                        socket.close();
                    } catch (Exception ignored) {}
                }
            }
        });
    }

    @PluginMethod
    public void printRaw(PluginCall call) {
        final String address = call.getString("address");
        final String base64Data = call.getString("data");

        if (address == null || address.isEmpty()) {
            call.reject("Printer address is required");
            return;
        }

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Print data is empty");
            return;
        }

        getBridge().execute(() -> {
            BluetoothAdapter adapter = getAdapter();
            if (adapter == null || !adapter.isEnabled()) {
                call.reject("Bluetooth is disabled");
                return;
            }

            BluetoothSocket socket = null;
            OutputStream outputStream = null;

            try {
                byte[] printBytes = Base64.decode(base64Data, Base64.DEFAULT);
                BluetoothDevice device = adapter.getRemoteDevice(address);
                adapter.cancelDiscovery();

                try {
                    socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                    socket.connect();
                } catch (Exception primaryEx) {
                    Log.w(TAG, "Primary SPP connect failed, trying RFCOMM port 1 reflection: " + primaryEx.getMessage());
                    Method m = device.getClass().getMethod("createRfcommSocket", new Class[]{int.class});
                    socket = (BluetoothSocket) m.invoke(device, 1);
                    socket.connect();
                }

                outputStream = socket.getOutputStream();
                outputStream.write(printBytes);
                outputStream.flush();

                // Brief pause allowing printer hardware buffer to drain
                try {
                    Thread.sleep(200);
                } catch (InterruptedException ignored) {}

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("bytesPrinted", printBytes.length);
                ret.put("message", "Printed successfully to " + device.getName());
                call.resolve(ret);

            } catch (Exception e) {
                Log.e(TAG, "Print job failed", e);
                call.reject("Failed to print to " + address + ": " + e.getMessage());
            } finally {
                if (outputStream != null) {
                    try {
                        outputStream.close();
                    } catch (Exception ignored) {}
                }
                if (socket != null) {
                    try {
                        socket.close();
                    } catch (Exception ignored) {}
                }
            }
        });
    }
}
