import React from 'react';
import { createPortal } from 'react-dom';
import { IconSpinner } from '../icons/Icons';

export function ExportModal({
  isExportModalOpen,
  setIsExportModalOpen,
  exportFormat,
  setExportFormat,
  exportRole,
  setExportRole,
  isExporting,
  handleExport
}) {
  if (!isExportModalOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={() => setIsExportModalOpen(false)}>
      <div className="add-section-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: 'var(--navy)', marginBottom: '12px' }}>Export Course Content</h3>
        <div className="config-item">
          <label>Export Format</label>
          <select 
            className="prompt-textarea"
            style={{ minHeight: 'auto', padding: '10px' }}
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="pdf">PDF Document (.pdf)</option>
            <option value="docx">Word Document (.docx)</option>
            <option value="md">Markdown Document (.md)</option>
            <option value="html">Web Page (.html)</option>
            <option value="zip">ZIP Package (PDF, DOCX, HTML & MD)</option>
          </select>
        </div>

        <div className="config-item">
          <label>Target Audience POV</label>
          <select 
            className="prompt-textarea"
            style={{ minHeight: 'auto', padding: '10px' }}
            value={exportRole} 
            disabled={exportFormat === 'zip'}
            onChange={(e) => setExportRole(e.target.value)}
          >
            <option value="all">All Roles (Combined)</option>
            <option value="creator">Creator POV only</option>
            <option value="student">Student POV only</option>
            <option value="educator">Educator POV only</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="file-upload-btn" onClick={() => setIsExportModalOpen(false)} disabled={isExporting}>Cancel</button>
          <button className="action-btn" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <><IconSpinner /> Exporting…</> : '📥 Download'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
