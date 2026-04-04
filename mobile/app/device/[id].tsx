import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Pressable, Alert, TextInput, Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useDevice, useDeviceHistory, useAssignDevice, useUnassignDevice, useCheckinDevice, useCheckoutDevice } from "@/hooks/useDevices";
import { useAssignLabel, useUnassignLabel } from "@/hooks/useLabels";
import type { DeviceStatus } from "@/types";

const STATUS_COLORS: Record<DeviceStatus, { bg: string; text: string }> = {
  available: { bg: "#dcfce7", text: "#15803d" },
  assigned: { bg: "#dbeafe", text: "#1d4ed8" },
  in_repair: { bg: "#fef9c3", text: "#a16207" },
  retired: { bg: "#f3f4f6", text: "#4b5563" },
};

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deviceId = Number(id);

  const { data: device, isLoading, error } = useDevice(deviceId);
  const { data: history } = useDeviceHistory(deviceId);

  const assignMutation = useAssignDevice();
  const unassignMutation = useUnassignDevice();
  const checkinMutation = useCheckinDevice();
  const checkoutMutation = useCheckoutDevice();

  const assignLabelMutation = useAssignLabel();
  const unassignLabelMutation = useUnassignLabel();

  // Modal state
  const [assignModal, setAssignModal] = useState(false);
  const [checkinModal, setCheckinModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [assignLabelModal, setAssignLabelModal] = useState(false);

  // Form fields
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [checkedInBy, setCheckedInBy] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [checkedOutBy, setCheckedOutBy] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [labelCode, setLabelCode] = useState("");
  const [labelAssignedBy, setLabelAssignedBy] = useState("");

  const handleAssign = () => {
    if (!assignedTo.trim() || !assignedBy.trim()) {
      Alert.alert("Required", "Please fill in all required fields.");
      return;
    }
    assignMutation.mutate(
      { id: deviceId, payload: { assigned_to: assignedTo, assigned_by: assignedBy, notes: assignNotes || undefined } },
      {
        onSuccess: () => {
          setAssignModal(false);
          setAssignedTo(""); setAssignedBy(""); setAssignNotes("");
        },
        onError: (e: unknown) => Alert.alert("Error", (e as Error).message),
      }
    );
  };

  const handleUnassign = () => {
    Alert.alert("Unassign Device", "Remove the current assignment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unassign",
        style: "destructive",
        onPress: () => unassignMutation.mutate(deviceId, {
          onError: (e: unknown) => Alert.alert("Error", (e as Error).message),
        }),
      },
    ]);
  };

  const handleCheckin = () => {
    if (!checkedInBy.trim() || !issueDesc.trim()) {
      Alert.alert("Required", "Please fill in all required fields.");
      return;
    }
    checkinMutation.mutate(
      { id: deviceId, payload: { checked_in_by: checkedInBy, issue_description: issueDesc } },
      {
        onSuccess: () => {
          setCheckinModal(false);
          setCheckedInBy(""); setIssueDesc("");
        },
        onError: (e: unknown) => Alert.alert("Error", (e as Error).message),
      }
    );
  };

  const handleCheckout = () => {
    if (!checkedOutBy.trim()) {
      Alert.alert("Required", "Please enter who is checking out the device.");
      return;
    }
    checkoutMutation.mutate(
      { id: deviceId, payload: { checked_out_by: checkedOutBy, resolution_notes: resolutionNotes || undefined } },
      {
        onSuccess: () => {
          setCheckoutModal(false);
          setCheckedOutBy(""); setResolutionNotes("");
        },
        onError: (e: unknown) => Alert.alert("Error", (e as Error).message),
      }
    );
  };

  const handleAssignLabel = () => {
    if (!labelCode.trim() || !labelAssignedBy.trim()) {
      Alert.alert("Required", "Please enter the label code and your name.");
      return;
    }
    assignLabelMutation.mutate(
      { labelCode: labelCode.trim().toUpperCase(), device_id: deviceId, assigned_by: labelAssignedBy.trim() },
      {
        onSuccess: () => {
          setAssignLabelModal(false);
          setLabelCode(""); setLabelAssignedBy("");
        },
        onError: (e: unknown) => Alert.alert("Error", (e as Error).message),
      }
    );
  };

  const handleUnassignLabel = () => {
    if (!device?.qr_code) return;
    Alert.alert("Remove Label", `Remove label ${device.qr_code} from this device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => unassignLabelMutation.mutate(device.qr_code!, {
          onError: (e: unknown) => Alert.alert("Error", (e as Error).message),
        }),
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (error || !device) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Device not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[device.status] ?? STATUS_COLORS.available;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.deviceName}>{device.device_name}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>
              {device.status.replace("_", " ")}
            </Text>
          </View>
        </View>
        {device.client_name ? (
          <Text style={styles.clientName}>{device.client_name}</Text>
        ) : null}
      </View>

      {/* Label */}
      <View style={styles.labelCard}>
        <Text style={styles.sectionTitle}>QR Label</Text>
        {device.qr_code ? (
          <>
            <View style={styles.qrWrapper}>
              <QRCode value={device.qr_code} size={160} />
            </View>
            <Text style={styles.labelCodeText}>{device.qr_code}</Text>
            <Pressable style={styles.removeLabelButton} onPress={handleUnassignLabel}>
              <Text style={styles.removeLabelText}>Remove Label</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.noLabelText}>No label assigned</Text>
            <Pressable style={styles.assignLabelButton} onPress={() => setAssignLabelModal(true)}>
              <Text style={styles.assignLabelButtonText}>Assign Label</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Hardware</Text>
        {[
          { label: "Serial Number", value: device.serial_number },
          { label: "Manufacturer", value: device.manufacturer },
          { label: "Model", value: device.model },
          { label: "OS", value: device.os_version },
          { label: "RAM", value: device.ram_gb ? `${device.ram_gb} GB` : null },
          { label: "Disk", value: device.disk_gb ? `${device.disk_gb} GB` : null },
          { label: "IP Address", value: device.ip_address },
          { label: "Last User", value: device.last_logged_in_user },
          { label: "Last Seen", value: device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : null },
        ].map(({ label, value }) =>
          value ? (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ) : null
        )}
      </View>

      {/* Assignment info */}
      {device.status === "assigned" && device.assigned_to ? (
        <View style={styles.assignmentCard}>
          <Text style={styles.sectionTitle}>Current Assignment</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned To</Text>
            <Text style={styles.detailValue}>{device.assigned_to}</Text>
          </View>
          {device.assigned_by ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned By</Text>
              <Text style={styles.detailValue}>{device.assigned_by}</Text>
            </View>
          ) : null}
          {device.assigned_at ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Since</Text>
              <Text style={styles.detailValue}>{new Date(device.assigned_at).toLocaleDateString()}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Repair info */}
      {device.status === "in_repair" && history?.repair_logs[0] ? (
        <View style={styles.repairCard}>
          <Text style={styles.sectionTitle}>Current Repair</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Checked In By</Text>
            <Text style={styles.detailValue}>{history.repair_logs[0].checked_in_by}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue</Text>
            <Text style={[styles.detailValue, styles.issueText]}>{history.repair_logs[0].issue_description}</Text>
          </View>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actions}>
        {(device.status === "available" || device.status === "assigned") && (
          <Pressable style={styles.actionButton} onPress={() => setAssignModal(true)}>
            <Text style={styles.actionButtonText}>Assign to User</Text>
          </Pressable>
        )}
        {device.status === "assigned" && (
          <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={handleUnassign}>
            <Text style={styles.dangerButtonText}>Unassign</Text>
          </Pressable>
        )}
        {(device.status === "available" || device.status === "assigned") && (
          <Pressable style={[styles.actionButton, styles.warnButton]} onPress={() => setCheckinModal(true)}>
            <Text style={styles.warnButtonText}>Check In for Repair</Text>
          </Pressable>
        )}
        {device.status === "in_repair" && (
          <Pressable style={[styles.actionButton, styles.successButton]} onPress={() => setCheckoutModal(true)}>
            <Text style={styles.successButtonText}>Check Out (Repair Complete)</Text>
          </Pressable>
        )}
      </View>

      {/* History */}
      {history && (history.assignments.length > 0 || history.repair_logs.length > 0) ? (
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>History</Text>
          {history.assignments.map((a) => (
            <View key={`a-${a.id}`} style={styles.historyItem}>
              <Text style={styles.historyType}>Assignment</Text>
              <Text style={styles.historyDetail}>
                {a.assigned_to} — by {a.assigned_by}
              </Text>
              <Text style={styles.historyDate}>
                {new Date(a.assigned_at).toLocaleDateString()}
                {a.returned_at ? ` → ${new Date(a.returned_at).toLocaleDateString()}` : " (active)"}
              </Text>
            </View>
          ))}
          {history.repair_logs.map((r) => (
            <View key={`r-${r.id}`} style={styles.historyItem}>
              <Text style={[styles.historyType, styles.repairType]}>Repair</Text>
              <Text style={styles.historyDetail}>{r.issue_description}</Text>
              <Text style={styles.historyDate}>
                {new Date(r.checked_in_at).toLocaleDateString()}
                {r.checked_out_at ? ` → ${new Date(r.checked_out_at).toLocaleDateString()}` : " (open)"}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Assign Modal */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign Device</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Assign to (name or email) *"
              placeholderTextColor="#9ca3af"
              value={assignedTo}
              onChangeText={setAssignedTo}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Assigned by (your name) *"
              placeholderTextColor="#9ca3af"
              value={assignedBy}
              onChangeText={setAssignedBy}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              placeholder="Notes (optional)"
              placeholderTextColor="#9ca3af"
              value={assignNotes}
              onChangeText={setAssignNotes}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setAssignModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirm}
                onPress={handleAssign}
                disabled={assignMutation.isPending}
              >
                {assignMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Assign</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Check-In Modal */}
      <Modal visible={checkinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Check In for Repair</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Checked in by *"
              placeholderTextColor="#9ca3af"
              value={checkedInBy}
              onChangeText={setCheckedInBy}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              placeholder="Issue description *"
              placeholderTextColor="#9ca3af"
              value={issueDesc}
              onChangeText={setIssueDesc}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setCheckinModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, styles.warnConfirm]}
                onPress={handleCheckin}
                disabled={checkinMutation.isPending}
              >
                {checkinMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Check In</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Check-Out Modal */}
      <Modal visible={checkoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Check Out (Repair Complete)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Checked out by *"
              placeholderTextColor="#9ca3af"
              value={checkedOutBy}
              onChangeText={setCheckedOutBy}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              placeholder="Resolution notes (optional)"
              placeholderTextColor="#9ca3af"
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setCheckoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, styles.successConfirm]}
                onPress={handleCheckout}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Complete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Label Modal */}
      <Modal visible={assignLabelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign Label</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Label code (e.g. ASST-00001) *"
              placeholderTextColor="#9ca3af"
              value={labelCode}
              onChangeText={setLabelCode}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Assigned by (your name) *"
              placeholderTextColor="#9ca3af"
              value={labelAssignedBy}
              onChangeText={setLabelAssignedBy}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => { setAssignLabelModal(false); setLabelCode(""); setLabelAssignedBy(""); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirm}
                onPress={handleAssignLabel}
                disabled={assignLabelMutation.isPending}
              >
                {assignLabelMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Assign</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16, color: "#6b7280" },
  backButton: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  backButtonText: { color: "#fff", fontWeight: "600" },

  headerCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  deviceName: { fontSize: 20, fontWeight: "700", color: "#111827", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  clientName: { fontSize: 13, color: "#6b7280", marginTop: 4 },

  labelCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" },
  qrWrapper: { marginVertical: 12 },
  labelCodeText: { fontSize: 16, fontWeight: "700", color: "#4f46e5", fontFamily: "monospace", marginBottom: 8 },
  noLabelText: { fontSize: 14, color: "#9ca3af", marginVertical: 12 },
  assignLabelButton: { backgroundColor: "#4f46e5", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11 },
  assignLabelButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  removeLabelButton: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 8 },
  removeLabelText: { color: "#dc2626", fontSize: 13, fontWeight: "500" },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 },

  detailsCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  assignmentCard: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#bfdbfe" },
  repairCard: { backgroundColor: "#fefce8", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#fef08a" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  detailLabel: { fontSize: 13, color: "#6b7280" },
  detailValue: { fontSize: 13, fontWeight: "500", color: "#111827", maxWidth: "60%", textAlign: "right" },
  issueText: { color: "#a16207" },

  actions: { gap: 10 },
  actionButton: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  dangerButton: { backgroundColor: "#fff5f5", borderWidth: 1, borderColor: "#fecaca" },
  warnButton: { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fef08a" },
  successButton: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  actionButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  dangerButtonText: { color: "#dc2626", fontWeight: "600", fontSize: 15 },
  warnButtonText: { color: "#a16207", fontWeight: "600", fontSize: 15 },
  successButtonText: { color: "#15803d", fontWeight: "600", fontSize: 15 },

  historyCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  historyItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 2 },
  historyType: { fontSize: 11, fontWeight: "700", color: "#2563eb", textTransform: "uppercase" },
  repairType: { color: "#a16207" },
  historyDetail: { fontSize: 13, color: "#111827" },
  historyDate: { fontSize: 11, color: "#9ca3af" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  modalInput: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: "#111827",
  },
  modalInputMulti: { height: 90, textAlignVertical: "top" },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  modalCancelText: { color: "#374151", fontWeight: "600" },
  modalConfirm: { flex: 1, backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  warnConfirm: { backgroundColor: "#d97706" },
  successConfirm: { backgroundColor: "#16a34a" },
  modalConfirmText: { color: "#fff", fontWeight: "600" },
});
