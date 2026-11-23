import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  ExternalLink,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building2,
  FlaskConical,
  Camera,
  Info
} from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { DocumentLinkPreview } from '../components/DocumentLinkPreview';
import { getSupabaseClient } from '../data/api';

export interface Form5DbRow {
  id: string;
  campus_name: string;
  row_id: number;
  requirement: string | null;
  description: string | null;
}

export interface Form5EvidenceDbRow {
  id: number;
  parent_id: string;
  source_row: number;
  evidence_text: string | null;
  drive_link: string | null;
}

export interface Form5EvidenceItem {
  id: number | string;
  title: string;
  url?: string;
}

export interface Form5RequirementItem {
  id: string;
  rowId: number;
  campusName: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  sectionTag: string;
  subSectionTag?: string;
  requirement: string;
  description: string;
  category: 'library' | 'facility' | 'laboratory';
  status: 'With evidence' | 'Pending';
  evidences: Form5EvidenceItem[];
}

export const CAMPUS_TABS: {
  id: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  code: string;
  tabLabel: string;
  shortName: string;
  fullLabel: string;
}[] = [
  { id: 'Main', code: 'MAIN', tabLabel: 'Main campus', shortName: 'Main', fullLabel: 'Main Campus' },
  { id: 'Pagadian', code: 'PAGADIAN', tabLabel: 'Pagadian', shortName: 'Pagadian', fullLabel: 'Pagadian Campus' },
  { id: 'Dumingag', code: 'DUMINGAG', tabLabel: 'Dumingag', shortName: 'Dumingag', fullLabel: 'Dumingag Campus' },
  { id: 'CMSE', code: 'LAKEWOOD', tabLabel: 'Lakewood', shortName: 'Lakewood', fullLabel: 'Lakewood Campus' }
];

const FORM5_CACHE_KEY = 'jhcsc_form5_supabase_v15';
const FORM5_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1wsKc3p8Wn6KnZnUNm5tHSVRPX62kJmxk9jfLgXamPhk/edit?usp=sharing';

// Extracted facility, laboratory, organizational chart, Section 6, and Pagadian Section 7 photos keyed by Google Drive file ID
const LOCAL_EXTRACTED_PHOTOS_BY_DRIVE_ID: Record<string, string[]> = {
  '10ZIAYqm-NKR9bNW4aIUGtGsBQwBhtSEj': [
    '/assets/form5/10ZIAYqm-NKR9bNW4aIUGtGsBQwBhtSEj.jpg',
    '/assets/form5/10ZIAYqm-NKR9bNW4aIUGtGsBQwBhtSEj_2.jpg',
    '/assets/form5/10ZIAYqm-NKR9bNW4aIUGtGsBQwBhtSEj_3.jpg'
  ],
  '147LRxO1LhgpnGeMQYa8sClGU9yS_r_61': [
    '/assets/form5/147LRxO1LhgpnGeMQYa8sClGU9yS_r_61.jpg',
    '/assets/form5/147LRxO1LhgpnGeMQYa8sClGU9yS_r_61_2.jpg'
  ],
  '14Tkqx_UDSO64ApSn_eepIIizSa2pXQLV': [
    '/assets/form5/14Tkqx_UDSO64ApSn_eepIIizSa2pXQLV.jpg',
    '/assets/form5/14Tkqx_UDSO64ApSn_eepIIizSa2pXQLV_2.jpg',
    '/assets/form5/14Tkqx_UDSO64ApSn_eepIIizSa2pXQLV_3.jpg',
    '/assets/form5/14Tkqx_UDSO64ApSn_eepIIizSa2pXQLV_4.jpg',
    '/assets/form5/14Tkqx_UDSO64ApSn_eepIIizSa2pXQLV_5.jpg'
  ],
  '15L_9CNdCfILLMlRuXkeM4JLO82xXJUoK': [
    '/assets/form5/15L_9CNdCfILLMlRuXkeM4JLO82xXJUoK.jpg',
    '/assets/form5/15L_9CNdCfILLMlRuXkeM4JLO82xXJUoK_2.jpg'
  ],
  '15j4Zp2o95Sw_AcH9QmTqNIBp1MGmKMQ1': [
    '/assets/form5/15j4Zp2o95Sw_AcH9QmTqNIBp1MGmKMQ1_3.jpg'
  ],
  '16evuocuXgnRvtHLrhsoR-v-k6ImolIdF': [
    '/assets/form5/16evuocuXgnRvtHLrhsoR-v-k6ImolIdF.jpg',
    '/assets/form5/16evuocuXgnRvtHLrhsoR-v-k6ImolIdF_2.jpg'
  ],
  '16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5': [
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5.jpg',
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5_2.jpg',
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5_3.jpg',
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5_4.jpg',
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5_5.jpg',
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5_6.jpg'
  ],
  '172JVZFUYYztOHTk6tpdpDyubfiAFfe-X': [
    '/assets/form5/172JVZFUYYztOHTk6tpdpDyubfiAFfe-X_3.jpg',
    '/assets/form5/172JVZFUYYztOHTk6tpdpDyubfiAFfe-X_4.jpg'
  ],
  '17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3': [
    '/assets/form5/17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3.jpg',
    '/assets/form5/17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3_2.jpg',
    '/assets/form5/17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3_3.jpg',
    '/assets/form5/17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3_4.jpg',
    '/assets/form5/17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3_5.jpg',
    '/assets/form5/17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3_6.jpg',
    '/assets/form5/17d_pRZyMzEC3fBEC4ivWSz3wR7Hdbgj3_7.jpg'
  ],
  '18EoOIjnKMIy_0FtRLLcJh_1E1vWQUbDf': [
    '/assets/form5/18EoOIjnKMIy_0FtRLLcJh_1E1vWQUbDf.jpg'
  ],
  '18VGOBWNFeqRMklPvPRl4wV3djmdYS9DX': [
    '/assets/form5/18VGOBWNFeqRMklPvPRl4wV3djmdYS9DX_3.jpg',
    '/assets/form5/18VGOBWNFeqRMklPvPRl4wV3djmdYS9DX_4.jpg',
    '/assets/form5/18VGOBWNFeqRMklPvPRl4wV3djmdYS9DX_5.jpg',
    '/assets/form5/18VGOBWNFeqRMklPvPRl4wV3djmdYS9DX_6.jpg',
    '/assets/form5/18VGOBWNFeqRMklPvPRl4wV3djmdYS9DX_7.jpg'
  ],
  '18f0m5_r_Qn6FesO98uwhkEIa-Hq_qHfv': [
    '/assets/form5/18f0m5_r_Qn6FesO98uwhkEIa-Hq_qHfv_3.jpg'
  ],
  '1AB2y0AV-hzNVpH0YGN3xnrMPinieD72P': [
    '/assets/form5/1AB2y0AV-hzNVpH0YGN3xnrMPinieD72P.jpg',
    '/assets/form5/1AB2y0AV-hzNVpH0YGN3xnrMPinieD72P_2.jpg'
  ],
  '1AJkAW0xNyiZQ5nobKougSZRvcvcjhpgq': [
    '/assets/form5/1AJkAW0xNyiZQ5nobKougSZRvcvcjhpgq_3.jpg'
  ],
  '1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H': [
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H.jpg',
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H_2.jpg',
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H_3.jpg',
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H_4.jpg',
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H_5.jpg',
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H_6.jpg',
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H_7.jpg',
    '/assets/form5/1BoZ4BSbyvKRVRmZy_oHD1pVgh34zmu3H_8.jpg'
  ],
  '1BvX5bARJWqk2A2WhL93CRiX5VhB_d6ms': [
    '/assets/form5/1BvX5bARJWqk2A2WhL93CRiX5VhB_d6ms.jpg',
    '/assets/form5/1BvX5bARJWqk2A2WhL93CRiX5VhB_d6ms_2.jpg'
  ],
  '1CmZnHzX2nuBRgwSZ6r-7QGGeHb_6HtmM': [
    '/assets/form5/1CmZnHzX2nuBRgwSZ6r-7QGGeHb_6HtmM.jpg',
    '/assets/form5/1CmZnHzX2nuBRgwSZ6r-7QGGeHb_6HtmM_2.jpg'
  ],
  '1DDSWItTPWijn028FsPwOYJERJsgGWV6k': ['/assets/form5/1DDSWItTPWijn028FsPwOYJERJsgGWV6k.jpg'],
  '1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn': [
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_3.jpg',
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_4.jpg',
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_5.jpg',
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_6.jpg',
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_7.jpg',
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_8.jpg'
  ],
  '1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS': [
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS.jpg',
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS_2.jpg',
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS_3.jpg',
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS_4.jpg',
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS_5.jpg',
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS_6.jpg',
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS_7.jpg',
    '/assets/form5/1Fob70dnIhoCHMNR2bvloZ48rWjqslCKS_8.jpg'
  ],
  '1GNJAxWuOR9ikz4ciUiDjKoIfUTlzLMuo': ['/assets/form5/1GNJAxWuOR9ikz4ciUiDjKoIfUTlzLMuo.jpg'],
  '1I3ov9bVR3OnCt8hBJmiB9z4IYk3FGlNf': [
    '/assets/form5/1I3ov9bVR3OnCt8hBJmiB9z4IYk3FGlNf.jpg',
    '/assets/form5/1I3ov9bVR3OnCt8hBJmiB9z4IYk3FGlNf_2.jpg',
    '/assets/form5/1I3ov9bVR3OnCt8hBJmiB9z4IYk3FGlNf_3.jpg',
    '/assets/form5/1I3ov9bVR3OnCt8hBJmiB9z4IYk3FGlNf_4.jpg'
  ],
  '1Iim1ixSR4xNyGxN0UtE_5Ms7AQICBG80': [
    '/assets/form5/1Iim1ixSR4xNyGxN0UtE_5Ms7AQICBG80.jpg',
    '/assets/form5/1Iim1ixSR4xNyGxN0UtE_5Ms7AQICBG80_2.jpg',
    '/assets/form5/1Iim1ixSR4xNyGxN0UtE_5Ms7AQICBG80_3.jpg'
  ],
  '1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c': [
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c.jpg',
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c_2.jpg',
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c_3.jpg',
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c_4.jpg',
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c_5.jpg',
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c_6.jpg',
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c_7.jpg',
    '/assets/form5/1KbRqqFhgWkJYRSx0PMmO8PR-39UrII5c_8.jpg'
  ],
  '1KnNaK5bTdjqZY3ZwsxiEoLIZTh_9d3fo': [
    '/assets/form5/1KnNaK5bTdjqZY3ZwsxiEoLIZTh_9d3fo.jpg',
    '/assets/form5/1KnNaK5bTdjqZY3ZwsxiEoLIZTh_9d3fo_2.jpg'
  ],
  '1N9fjGcYYB5z-extKwFyWhSWcpPIfAoGU': [
    '/assets/form5/1N9fjGcYYB5z-extKwFyWhSWcpPIfAoGU.jpg'
  ],
  '1PJdMfNae4vbJgpOoBMrf2xsXgGBp_Kog': [
    '/assets/form5/1PJdMfNae4vbJgpOoBMrf2xsXgGBp_Kog.jpg'
  ],
  '1PTlXlP7MaOpnWYL-gVziZ9Lv9Bu1Oy43': [
    '/assets/form5/1PTlXlP7MaOpnWYL-gVziZ9Lv9Bu1Oy43.jpg',
    '/assets/form5/1PTlXlP7MaOpnWYL-gVziZ9Lv9Bu1Oy43_2.jpg'
  ],
  '1Pfa272VdNwgVfeOM9EJsbn1h4ulsiCw7': [
    '/assets/form5/1Pfa272VdNwgVfeOM9EJsbn1h4ulsiCw7.jpg',
    '/assets/form5/1Pfa272VdNwgVfeOM9EJsbn1h4ulsiCw7_2.jpg'
  ],
  '1TTQt8R-3Qf3jipD6ijf12lqaK4ZyWMrF': [
    '/assets/form5/1TTQt8R-3Qf3jipD6ijf12lqaK4ZyWMrF.jpg',
    '/assets/form5/1TTQt8R-3Qf3jipD6ijf12lqaK4ZyWMrF_2.jpg'
  ],
  '1U2A02QnwIvZMQjds6JQDMfaJ67uXEtAv': [
    '/assets/form5/1U2A02QnwIvZMQjds6JQDMfaJ67uXEtAv.jpg',
    '/assets/form5/1U2A02QnwIvZMQjds6JQDMfaJ67uXEtAv_2.jpg'
  ],
  '1UODridrx_fcFJONnsxDd-qt3f_-cSRBS': [
    '/assets/form5/1UODridrx_fcFJONnsxDd-qt3f_-cSRBS.jpg',
    '/assets/form5/1UODridrx_fcFJONnsxDd-qt3f_-cSRBS_2.jpg',
    '/assets/form5/1UODridrx_fcFJONnsxDd-qt3f_-cSRBS_3.jpg',
    '/assets/form5/1UODridrx_fcFJONnsxDd-qt3f_-cSRBS_4.jpg',
    '/assets/form5/1UODridrx_fcFJONnsxDd-qt3f_-cSRBS_5.jpg',
    '/assets/form5/1UODridrx_fcFJONnsxDd-qt3f_-cSRBS_6.jpg'
  ],
  '1VKKzt7rViwFCQH0dNtAhMIRuK-FvngOg': [
    '/assets/form5/1VKKzt7rViwFCQH0dNtAhMIRuK-FvngOg.jpg',
    '/assets/form5/1VKKzt7rViwFCQH0dNtAhMIRuK-FvngOg_2.jpg'
  ],
  '1VSFVVNQEMfgUuzsPqwKiJLfvQpzBW9Mp': [
    '/assets/form5/1VSFVVNQEMfgUuzsPqwKiJLfvQpzBW9Mp.jpg',
    '/assets/form5/1VSFVVNQEMfgUuzsPqwKiJLfvQpzBW9Mp_2.jpg'
  ],
  '1WKsgoRfOTioxgUp5OHFbUP0Vta_o0Zq5': [
    '/assets/form5/1WKsgoRfOTioxgUp5OHFbUP0Vta_o0Zq5.jpg',
    '/assets/form5/1WKsgoRfOTioxgUp5OHFbUP0Vta_o0Zq5_2.jpg'
  ],
  '1WobyHQCLAwTSS7ua4UCxuEvSkoQkpKK_': [
    '/assets/form5/1WobyHQCLAwTSS7ua4UCxuEvSkoQkpKK_.jpg',
    '/assets/form5/1WobyHQCLAwTSS7ua4UCxuEvSkoQkpKK__2.jpg'
  ],
  '1XFLpqHUS4VoPHpk02qax8qkhD-Uu35vJ': [
    '/assets/form5/1XFLpqHUS4VoPHpk02qax8qkhD-Uu35vJ.jpg',
    '/assets/form5/1XFLpqHUS4VoPHpk02qax8qkhD-Uu35vJ_2.jpg',
    '/assets/form5/1XFLpqHUS4VoPHpk02qax8qkhD-Uu35vJ_3.jpg'
  ],
  '1YAF5F18zfXwOKxY-NeDq6htF3lkSDSTU': [
    '/assets/form5/1YAF5F18zfXwOKxY-NeDq6htF3lkSDSTU.jpg',
    '/assets/form5/1YAF5F18zfXwOKxY-NeDq6htF3lkSDSTU_2.jpg'
  ],
  '1YcL6Pg_-9zHck6lCUoNFAlQFnKNUMbDS': [
    '/assets/form5/1YcL6Pg_-9zHck6lCUoNFAlQFnKNUMbDS.jpg',
    '/assets/form5/1YcL6Pg_-9zHck6lCUoNFAlQFnKNUMbDS_2.jpg'
  ],
  '1Ygy1esl8RVu-hqiXpC5HzZ0lgW1sTOMm': [
    '/assets/form5/1Ygy1esl8RVu-hqiXpC5HzZ0lgW1sTOMm_3.jpg',
    '/assets/form5/1Ygy1esl8RVu-hqiXpC5HzZ0lgW1sTOMm_4.jpg'
  ],
  '1Yjzfrg6JGw5jVsfRQtkBWKKecWHptqC1': [
    '/assets/form5/1Yjzfrg6JGw5jVsfRQtkBWKKecWHptqC1.jpg',
    '/assets/form5/1Yjzfrg6JGw5jVsfRQtkBWKKecWHptqC1_2.jpg'
  ],
  '1ZDcl8UdLs6sg0A4Tj2vAm-CtYyH0fBMp': [
    '/assets/form5/1ZDcl8UdLs6sg0A4Tj2vAm-CtYyH0fBMp.jpg',
    '/assets/form5/1ZDcl8UdLs6sg0A4Tj2vAm-CtYyH0fBMp_2.jpg'
  ],
  '1_A04BeGio2NuRaTTTP-Ot4EEGphZ-lyR': [],
  '1_Al6bVFAKOciQ7zHw1s1DCw4tkFgkC63': [
    '/assets/form5/1_Al6bVFAKOciQ7zHw1s1DCw4tkFgkC63.jpg',
    '/assets/form5/1_Al6bVFAKOciQ7zHw1s1DCw4tkFgkC63_2.jpg'
  ],
  '1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH': [
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_3.jpg',
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_4.jpg',
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_5.jpg',
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_6.jpg',
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_7.jpg'
  ],
  '1aupbQsq8KtUFUtWK298g5BP_LYrb1tmZ': [
    '/assets/form5/1aupbQsq8KtUFUtWK298g5BP_LYrb1tmZ.jpg',
    '/assets/form5/1aupbQsq8KtUFUtWK298g5BP_LYrb1tmZ_2.jpg'
  ],
  '1bAkPGdVUfV89IIEHx87pNBKySoMuw8ia': [
    '/assets/form5/1bAkPGdVUfV89IIEHx87pNBKySoMuw8ia_3.jpg'
  ],
  '1c3pGzRsiFT_B6l_kL3nv6cSNr08IVXRe': [
    '/assets/form5/1c3pGzRsiFT_B6l_kL3nv6cSNr08IVXRe.jpg',
    '/assets/form5/1c3pGzRsiFT_B6l_kL3nv6cSNr08IVXRe_2.jpg'
  ],
  '1ci-uuH8-PKY5OKsXe2N40NWwjYBXLFVm': [
    '/assets/form5/1ci-uuH8-PKY5OKsXe2N40NWwjYBXLFVm.jpg',
    '/assets/form5/1ci-uuH8-PKY5OKsXe2N40NWwjYBXLFVm_2.jpg'
  ],
  '1fSEza48n_8mGf23FZUoE8wdzyz2wlftP': [
    '/assets/form5/1fSEza48n_8mGf23FZUoE8wdzyz2wlftP.jpg',
    '/assets/form5/1fSEza48n_8mGf23FZUoE8wdzyz2wlftP_2.jpg'
  ],
  '1g7lU6OqLcSWuyn99mazgZtyHEEpko6H7': [
    '/assets/form5/1g7lU6OqLcSWuyn99mazgZtyHEEpko6H7_3.jpg',
    '/assets/form5/1g7lU6OqLcSWuyn99mazgZtyHEEpko6H7_4.jpg'
  ],
  '1gJoKMbhTD_xG2xBm3VpjBG4laZsqFi0a': [
    '/assets/form5/1gJoKMbhTD_xG2xBm3VpjBG4laZsqFi0a.jpg',
    '/assets/form5/1gJoKMbhTD_xG2xBm3VpjBG4laZsqFi0a_2.jpg'
  ],
  '1i8fBpOX7TSBEs-t9c5ZqGaped0LIkKzG': [
    '/assets/form5/1i8fBpOX7TSBEs-t9c5ZqGaped0LIkKzG.jpg'
  ],
  '1iO6eZvXifUs81iJJP9xZgNfiHra7mt1L': [
    '/assets/form5/1iO6eZvXifUs81iJJP9xZgNfiHra7mt1L_3.jpg',
    '/assets/form5/1iO6eZvXifUs81iJJP9xZgNfiHra7mt1L_4.jpg'
  ],
  '1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF': [
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_3.jpg',
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_4.jpg',
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_5.jpg',
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_6.jpg',
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_7.jpg'
  ],
  '1jaRaT9A-q1zSHLqzQReDzhQCZKbypA0_': [
    '/assets/form5/1jaRaT9A-q1zSHLqzQReDzhQCZKbypA0_.jpg',
    '/assets/form5/1jaRaT9A-q1zSHLqzQReDzhQCZKbypA0__2.jpg'
  ],
  '1lB8g6FCZZCoplOBp8DKrc4nYVxGt5KI1': [
    '/assets/form5/1lB8g6FCZZCoplOBp8DKrc4nYVxGt5KI1.jpg',
    '/assets/form5/1lB8g6FCZZCoplOBp8DKrc4nYVxGt5KI1_2.jpg',
    '/assets/form5/1lB8g6FCZZCoplOBp8DKrc4nYVxGt5KI1_3.jpg',
    '/assets/form5/1lB8g6FCZZCoplOBp8DKrc4nYVxGt5KI1_4.jpg'
  ],
  '1lW4K7K42DIb8lu7-4jsRZYodS-pkJt0i': [
    '/assets/form5/1lW4K7K42DIb8lu7-4jsRZYodS-pkJt0i.jpg',
    '/assets/form5/1lW4K7K42DIb8lu7-4jsRZYodS-pkJt0i_2.jpg'
  ],
  '1lmvuifN_aCX9wNdDv-mBM2ExSC5NcANz': [
    '/assets/form5/1lmvuifN_aCX9wNdDv-mBM2ExSC5NcANz.jpg',
    '/assets/form5/1lmvuifN_aCX9wNdDv-mBM2ExSC5NcANz_2.jpg'
  ],
  '1pJi8B4IMx3K9J7S1VhrbWeueczhf_y8L': ['/assets/form5/1pJi8B4IMx3K9J7S1VhrbWeueczhf_y8L.jpg'],
  '1pLPZgRRTn2aT6XmQNwqAMyuy2__9aU4B': [
    '/assets/form5/1pLPZgRRTn2aT6XmQNwqAMyuy2__9aU4B_3.jpg'
  ],
  '1qYyFC8Z3r_tITw9hWKfh1wcncknUfPE4': [
    '/assets/form5/1qYyFC8Z3r_tITw9hWKfh1wcncknUfPE4_3.jpg'
  ],
  '1rqeuLzANOpUBSJV48fiSy7QkPXt_AKRB': [
    '/assets/form5/1rqeuLzANOpUBSJV48fiSy7QkPXt_AKRB.jpg',
    '/assets/form5/1rqeuLzANOpUBSJV48fiSy7QkPXt_AKRB_2.jpg'
  ],
  '1s0VZOYC_ALlWCgm1a-L2wKOEtoLcbGlh': [
    '/assets/form5/1s0VZOYC_ALlWCgm1a-L2wKOEtoLcbGlh.jpg',
    '/assets/form5/1s0VZOYC_ALlWCgm1a-L2wKOEtoLcbGlh_2.jpg'
  ],
  '1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT': [
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_2.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_4.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_5.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_6.jpg'
  ],
  '1t6U4MkKDMcdosXrqwrVMa2PTfO3QLK95': [
    '/assets/form5/1t6U4MkKDMcdosXrqwrVMa2PTfO3QLK95_3.jpg',
    '/assets/form5/1t6U4MkKDMcdosXrqwrVMa2PTfO3QLK95_4.jpg',
    '/assets/form5/1t6U4MkKDMcdosXrqwrVMa2PTfO3QLK95_5.jpg',
    '/assets/form5/1t6U4MkKDMcdosXrqwrVMa2PTfO3QLK95_6.jpg',
    '/assets/form5/1t6U4MkKDMcdosXrqwrVMa2PTfO3QLK95_7.jpg',
    '/assets/form5/1t6U4MkKDMcdosXrqwrVMa2PTfO3QLK95_8.jpg'
  ],
  '1taGJMi2ZeE_3qSqOzt7VFztocKrQEuiR': [
    '/assets/form5/1taGJMi2ZeE_3qSqOzt7VFztocKrQEuiR.jpg',
    '/assets/form5/1taGJMi2ZeE_3qSqOzt7VFztocKrQEuiR_2.jpg'
  ],
  '1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn': [
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_3.jpg',
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_4.jpg',
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_5.jpg',
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_6.jpg',
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_7.jpg',
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_8.jpg'
  ],
  '1wvuBf6Rxk2sowkdQJTn-5bVJvZzmTe_z': ['/assets/form5/1wvuBf6Rxk2sowkdQJTn-5bVJvZzmTe_z.jpg'],
  '1yCTCzXibMbD3LnVbe-mP_EcJCYB8fks4': [
    '/assets/form5/1yCTCzXibMbD3LnVbe-mP_EcJCYB8fks4.jpg',
    '/assets/form5/1yCTCzXibMbD3LnVbe-mP_EcJCYB8fks4_2.jpg'
  ],
  '1zCWCi9SPiG72sG2NOI9dQkWo0voTav0E': [
    '/assets/form5/1zCWCi9SPiG72sG2NOI9dQkWo0voTav0E.jpg',
    '/assets/form5/1zCWCi9SPiG72sG2NOI9dQkWo0voTav0E_2.jpg',
    '/assets/form5/1zCWCi9SPiG72sG2NOI9dQkWo0voTav0E_3.jpg'
  ],
  '1zZbR_07TxxIa5cdAHh4lvqz4fNNX0G7u': [
    '/assets/form5/1zZbR_07TxxIa5cdAHh4lvqz4fNNX0G7u.jpg',
    '/assets/form5/1zZbR_07TxxIa5cdAHh4lvqz4fNNX0G7u_2.jpg'
  ],
  '1zcjtNTi2ivk5U9ZZ80ku_yiHyjrfuN8q': [
    '/assets/form5/1zcjtNTi2ivk5U9ZZ80ku_yiHyjrfuN8q.jpg',
    '/assets/form5/1zcjtNTi2ivk5U9ZZ80ku_yiHyjrfuN8q_2.jpg',
    '/assets/form5/1zcjtNTi2ivk5U9ZZ80ku_yiHyjrfuN8q_3.jpg',
    '/assets/form5/1zcjtNTi2ivk5U9ZZ80ku_yiHyjrfuN8q_4.jpg'
  ],
  '1ziRZlmXJlI7cXV9Mw_vIWyBVZL5ejN7b': [
    '/assets/form5/1ziRZlmXJlI7cXV9Mw_vIWyBVZL5ejN7b.jpg',
    '/assets/form5/1ziRZlmXJlI7cXV9Mw_vIWyBVZL5ejN7b_2.jpg',
    '/assets/form5/1ziRZlmXJlI7cXV9Mw_vIWyBVZL5ejN7b_3.jpg',
    '/assets/form5/1ziRZlmXJlI7cXV9Mw_vIWyBVZL5ejN7b_4.jpg',
    '/assets/form5/1ziRZlmXJlI7cXV9Mw_vIWyBVZL5ejN7b_5.jpg',
    '/assets/form5/1ziRZlmXJlI7cXV9Mw_vIWyBVZL5ejN7b_6.jpg'
  ],
  // Pagadian Campus Section 7 Drive IDs
  '1P-V5PUVV-82YCeWUuobM-3rHcN6X0g-S': [
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_3.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_4.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_5.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_6.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_7.jpg'
  ],
  '1WaLVajZamUYlA-R6N7ZGN6caWs6mctkl': [
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_3.jpg',
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_4.jpg',
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_5.jpg'
  ],
  '1jB6jmCOIibODKM1vlKK5HvvoZj2gvekO': [
    '/assets/form5/1j5O6GppCZywXvtDO_FemYYDsSNBuhtAk_3.jpg',
    '/assets/form5/1j5O6GppCZywXvtDO_FemYYDsSNBuhtAk_4.jpg',
    '/assets/form5/1j5O6GppCZywXvtDO_FemYYDsSNBuhtAk_5.jpg'
  ],
  '1yLzEXSbvBvHF5nHBaeYyULwWdr5vbdGY': [
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_3.jpg',
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_4.jpg',
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_5.jpg'
  ],
  '1TXm4Qn8uxwwhFYTrL82Ood-A1WiL5JMh': [
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_5.jpg',
    '/assets/form5/1GUXa51nyT_wdcjnylzzyqFVlkfwwARZy_3.jpg'
  ],
  '1ALLsa-mngOpB-2gmxohm-uFMTGKiJD5O': [
    '/assets/form5/1GUXa51nyT_wdcjnylzzyqFVlkfwwARZy_3.jpg'
  ],
  '1QEsiqZdDkm3_-ppGYtkUwrMspr9EY2_w': [
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_3.jpg',
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_4.jpg'
  ],
  '1jGvVz-DECBqUycb4aEY9x_QDi7IFcKGR': [
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_3.jpg',
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_4.jpg',
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_5.jpg'
  ],
  '1am6MMoyRYUsltsY5HcWZ78hEN78Gib8T': [
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_3.jpg',
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_4.jpg'
  ],
  // Dumingag Campus Section 7 Drive IDs (headers .jpg and footers _2.jpg excluded)
  '1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj': [
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_3.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_4.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_5.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_6.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_7.jpg'
  ],
  '1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q': [
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_3.jpg',
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_4.jpg',
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_5.jpg'
  ],
  '1j5O6GppCZywXvtDO_FemYYDsSNBuhtAk': [
    '/assets/form5/1j5O6GppCZywXvtDO_FemYYDsSNBuhtAk_3.jpg',
    '/assets/form5/1j5O6GppCZywXvtDO_FemYYDsSNBuhtAk_4.jpg',
    '/assets/form5/1j5O6GppCZywXvtDO_FemYYDsSNBuhtAk_5.jpg'
  ],
  '1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El': [
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_3.jpg',
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_4.jpg',
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_5.jpg'
  ],
  '17oyexdwowQMvCcDHvI_1ChNhibdvm02u': [],
  '1GUXa51nyT_wdcjnylzzyqFVlkfwwARZy': [
    '/assets/form5/1GUXa51nyT_wdcjnylzzyqFVlkfwwARZy_3.jpg'
  ],
  '13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26': [
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_3.jpg',
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_4.jpg'
  ],
  '1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy': [
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_3.jpg',
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_4.jpg',
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_5.jpg'
  ],
  // Main Campus Section 6 & Section 7 Drive IDs
  '1CCbrSd39YG4yQRSAUQavtuT2urpDeYAt': [
    '/assets/form5/1qYyFC8Z3r_tITw9hWKfh1wcncknUfPE4_3.jpg',
    '/assets/form5/18f0m5_r_Qn6FesO98uwhkEIa-Hq_qHfv_3.jpg'
  ],
  '1uwO2AdFCcqe2qhOn25_cLEOqutFFbVqh': [
    '/assets/form5/1pLPZgRRTn2aT6XmQNwqAMyuy2__9aU4B_3.jpg',
    '/assets/form5/1bAkPGdVUfV89IIEHx87pNBKySoMuw8ia_3.jpg'
  ],
  '1W2ozE-vPA4GfVoPYdipm42gyfYAhsPvb': [
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_3.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_4.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_5.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_6.jpg',
    '/assets/form5/1pbjDAHboxfJtXa1UrSAUtk9WG-0gHOlj_7.jpg'
  ],
  '1APq9Ol46BGOCqk5eEGEqLpf86Ktg-bXb': [
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_3.jpg',
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_4.jpg',
    '/assets/form5/1yZ1Qg8iFuOmjqYN0hadyvoVpxEVbP60Q_5.jpg'
  ],
  '1ujS8JXqmnsGFeXPK2_w788VCaymyKQXS': [
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_3.jpg',
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_4.jpg',
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_5.jpg'
  ],
  '1pXxn-XXSZkF9XTp-gh7NvDSuosPKXYoj': [
    '/assets/form5/1GUXa51nyT_wdcjnylzzyqFVlkfwwARZy_3.jpg',
    '/assets/form5/1Yjzfrg6JGw5jVsfRQtkBWKKecWHptqC1.jpg',
    '/assets/form5/1Yjzfrg6JGw5jVsfRQtkBWKKecWHptqC1_2.jpg'
  ],
  '12ADIqJbFvgVG6D3lxQuAE0Fi-R2b0Ls8': [
    '/assets/form5/1MiF0R6ojOn7j6OmHuVe3M_JGZH_ME-El_5.jpg',
    '/assets/form5/1GUXa51nyT_wdcjnylzzyqFVlkfwwARZy_3.jpg'
  ],
  '1oCT0Cl1x4VaDyab4HRN6e7DeTW1vsoXt': [
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_3.jpg',
    '/assets/form5/13C0tiA7x_rBnXiJJqyHtgKFbzWSaI_26_4.jpg'
  ],
  '1YS1ng2G-_M455S4MAvER1n8VKmjN5qDf': [
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_3.jpg',
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_4.jpg',
    '/assets/form5/1NxhgQhJnqw3-Br_b4yi_jCeOM8PAY4Zy_5.jpg'
  ],
  // Pagadian Campus Section 6 Drive IDs
  '10TJUEN5Eib70Mflv_geIckiYB0Y4AFs_': [
    '/assets/form5/1AB2y0AV-hzNVpH0YGN3xnrMPinieD72P.jpg',
    '/assets/form5/1AB2y0AV-hzNVpH0YGN3xnrMPinieD72P_2.jpg'
  ],
  '1TinCwr3bpRoy3QC9r5hGALvrlUX2MWMI': [
    '/assets/form5/1Pfa272VdNwgVfeOM9EJsbn1h4ulsiCw7.jpg',
    '/assets/form5/1Pfa272VdNwgVfeOM9EJsbn1h4ulsiCw7_2.jpg'
  ],
  '1GZb3NF5E_kIz6cv-QjDu-WNicx9exuT6': [
    '/assets/form5/1Yjzfrg6JGw5jVsfRQtkBWKKecWHptqC1.jpg',
    '/assets/form5/1Yjzfrg6JGw5jVsfRQtkBWKKecWHptqC1_2.jpg'
  ],
  '1d_eXsc1J-RzBu993RPiixjRRG_Xf-4Ia': [
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_3.jpg',
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_4.jpg',
    '/assets/form5/1tz1hjstKDk0cP3nbFAFZPKJFRGrsmyQn_5.jpg'
  ],
  '1_ChWLIoyIRm57r_YPHvCtDcuYbvOjnw6': [
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_3.jpg',
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_4.jpg',
    '/assets/form5/1_F1LfQbhGJkDIpgoVSfrNFtpMdDKlfBH_5.jpg'
  ],
  '1RVbo9C1O-EOOJRbctXaY6FjlzhrjdYDd': [
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_3.jpg',
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_4.jpg'
  ],
  '11u7DKort8GJqpjbb6dej9706B_v74wa7': [
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_5.jpg',
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_6.jpg'
  ],
  '1zctLRYB5A-TePaRZL38qfwdHxNoWvUgU': [
    '/assets/form5/1iYO_rFA3OfytmLyKieEq5-uX9au3EmFF_7.jpg'
  ],
  '1Dc9RTaCl5oXdvN80IBYFm6H-O_07TdDV': [
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_3.jpg',
    '/assets/form5/1DG70rJFhdTVI4BIQUkmSWl-f7-9zquwn_4.jpg'
  ],
  '10VMk68T1T5D3lygxod1BhmL9RFrr_HUE': [
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5.jpg',
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5_2.jpg',
    '/assets/form5/16yh5AXK5NYj4wwDuFr0I_ag2GH9UMvt5_3.jpg'
  ],
  '1kE6mdk9IeHXNo9XTXAmaVeMgouETM7-Q': [
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_2.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_4.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_5.jpg',
    '/assets/form5/1spSj6aACPwS1TAdXd1abAwwMDk1fpzpT_6.jpg'
  ],
  '1EzjeUe3Rn8ceYaLoAhclzy9M6sBhhVem': [
    '/assets/form5/1VKKzt7rViwFCQH0dNtAhMIRuK-FvngOg.jpg',
    '/assets/form5/1VKKzt7rViwFCQH0dNtAhMIRuK-FvngOg_2.jpg'
  ],
  '1imimiVTh3hCmz1FGXVMvKuKCzqyx3h8C': [
    '/assets/form5/1iO6eZvXifUs81iJJP9xZgNfiHra7mt1L_3.jpg',
    '/assets/form5/1iO6eZvXifUs81iJJP9xZgNfiHra7mt1L_4.jpg'
  ],
  '1scbFWMFQXCgrHsXfsBQalk0bQvmrddpD': [
    '/assets/form5/1qYyFC8Z3r_tITw9hWKfh1wcncknUfPE4_3.jpg'
  ],
  '1dpSBZ3NrW6pokBNkNZ_y58FKBOTbm53-': [
    '/assets/form5/18f0m5_r_Qn6FesO98uwhkEIa-Hq_qHfv_3.jpg'
  ],
  '1vJXk8SJdF-r5KBAr6eQwfXjNSJSdrluh': [
    '/assets/form5/1pLPZgRRTn2aT6XmQNwqAMyuy2__9aU4B_3.jpg'
  ],
  // CMSE Campus Section 7 Drive IDs (decorative chevron header .jpg excluded)
  '1oCYsarYgy7D9S14GJptaGzooiQBDdF5T': [
    '/assets/form5/1oCYsarYgy7D9S14GJptaGzooiQBDdF5T_2.jpg',
    '/assets/form5/1oCYsarYgy7D9S14GJptaGzooiQBDdF5T_3.jpg'
  ],
  '1MufFBEWCQi00sjjLAl6I_hHu297MlmF7': [
    '/assets/form5/1MufFBEWCQi00sjjLAl6I_hHu297MlmF7_2.jpg',
    '/assets/form5/1MufFBEWCQi00sjjLAl6I_hHu297MlmF7_3.jpg',
    '/assets/form5/1MufFBEWCQi00sjjLAl6I_hHu297MlmF7_4.jpg',
    '/assets/form5/1MufFBEWCQi00sjjLAl6I_hHu297MlmF7_5.jpg'
  ]
};

let cachedForm5ByCampus: Record<string, Form5RequirementItem[]> | null = null;
let prefetchForm5Promise: Promise<Record<string, Form5RequirementItem[]> | null> | null = null;

function extractDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) return matchFile[1];
  const matchDoc = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (matchDoc && matchDoc[1]) return matchDoc[1];
  const matchSheet = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (matchSheet && matchSheet[1]) return matchSheet[1];
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];
  return null;
}

function getEvidenceMedia(
  driveFileId: string | null,
  isPhotoCategory: boolean
): {
  hasPhotos: boolean;
  pages: string[];
  thumbnail: string;
} {
  if (!driveFileId) {
    return { hasPhotos: false, pages: [], thumbnail: '' };
  }

  const localExtracted = LOCAL_EXTRACTED_PHOTOS_BY_DRIVE_ID[driveFileId];
  const driveThumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w800`;
  const driveHighResUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`;

  if (isPhotoCategory && (localExtracted === undefined || localExtracted.length > 0)) {
    const photos = localExtracted && localExtracted.length > 0 ? localExtracted : [driveThumbnailUrl];
    return {
      hasPhotos: true,
      pages: photos,
      thumbnail: photos[0]
    };
  } else {
    const docPages = localExtracted && localExtracted.length > 0 ? localExtracted : [driveHighResUrl];
    return {
      hasPhotos: false,
      pages: docPages,
      thumbnail: docPages[0]
    };
  }
}

function getPhotoUrlsForDriveId(driveFileId?: string | null): {
  initialPhotoSrc: string;
  driveThumbnailUrl: string;
  galleryPhotos: string[];
} {
  if (!driveFileId) {
    return { initialPhotoSrc: '', driveThumbnailUrl: '', galleryPhotos: [] };
  }
  const driveThumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w800`;
  const localPhotos = LOCAL_EXTRACTED_PHOTOS_BY_DRIVE_ID[driveFileId];
  if (localPhotos !== undefined) {
    return {
      initialPhotoSrc: localPhotos[0] || '',
      driveThumbnailUrl,
      galleryPhotos: localPhotos
    };
  }
  return {
    initialPhotoSrc: driveThumbnailUrl,
    driveThumbnailUrl,
    galleryPhotos: [`https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1200`]
  };
}

function isPlaceholderEvidenceText(text?: string | null): boolean {
  if (!text) return true;
  const t = text.trim().toLowerCase();
  if (/\.(pdf|docx?|xlsx?)$/i.test(t)) return false;
  if (
    !t ||
    t === 'null' ||
    t === 'evidence' ||
    t === 'evidences' ||
    t === 'insert links to evidences' ||
    t === 'recommended supporting documents:' ||
    t.startsWith('- photo') ||
    t.startsWith('- inventory of materials') ||
    t === 'i.' ||
    t === 'ii.' ||
    t === 'iii.' ||
    t.includes(';') ||
    t.includes('approved library floor plan') ||
    t.includes('library floor plan') ||
    t.startsWith('photographs of') ||
    t.startsWith('photograps of') ||
    t.startsWith('inventory of') ||
    t.includes('library space allocation') ||
    t.includes('records of inactive') ||
    t.includes('conservation/preservation') ||
    t.includes('library facilities inspection') ||
    t.includes('seating capacity') ||
    t.includes('enrolment data') ||
    t.includes('statistics for the last 3 years') ||
    t.includes('ratio to user')
  ) {
    return true;
  }
  return false;
}

function isPlaceholderNarrative(desc?: string | null): boolean {
  if (!desc) return true;
  const d = desc.trim();
  const lower = d.toLowerCase();
  if (
    !d ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'description' ||
    lower === 'description/programs catered' ||
    lower === 's' ||
    lower === 'insert narrative description' ||
    lower.startsWith('insert summary') ||
    lower.startsWith('insert list')
  ) {
    return true;
  }
  return false;
}

function normalizeDatabaseNarrative(desc?: string | null): string {
  if (!desc) return '';
  const trimmed = desc.trim();
  if (isPlaceholderNarrative(trimmed)) {
    return '';
  }
  return trimmed
    .replace(/\bCMSE\s*\((?:Lakewood)\)/gi, 'Lakewood')
    .replace(/\bCanuto\s+M\.?\s*S\.?\s*Enerio\s*\(?CMSE\)?/gi, 'Lakewood')
    .replace(/\bCMSE\b/g, 'Lakewood');
}

function normalizeReqDedupeKey(req: string): string {
  return req
    .toLowerCase()
    .replace(/^(?:[0-9]+(?:\.[0-9]+)*\.?|[a-z]\.)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function cleanEvidenceDisplayLabel(rawText?: string | null): string {
  if (!rawText) return '';
  const withoutUrls = rawText
    .replace(/https?:\/\/[^\s<">]+/gi, '')
    .replace(/^[:\-\s|()]+|[:\-\s|()]+$/g, '')
    .trim();
  if (!withoutUrls || isPlaceholderEvidenceText(withoutUrls)) {
    return '';
  }
  return withoutUrls
    .replace(/\bCMSE\s*\((?:Lakewood)\)/gi, 'Lakewood')
    .replace(/\bCanuto\s+M\.?\s*S\.?\s*Enerio\s*\(?CMSE\)?/gi, 'Lakewood')
    .replace(/\bCMSE\b/g, 'Lakewood');
}

function resolveEvidenceRowLink(ev: Form5EvidenceDbRow): string | undefined {
  const rawText = (ev.evidence_text || '').trim();
  const urlMatch = rawText.match(/https?:\/\/[^\s<">]+/i);
  return ev.drive_link && ev.drive_link.trim() && ev.drive_link.trim().toUpperCase() !== 'NULL'
    ? ev.drive_link.trim()
    : urlMatch
    ? urlMatch[0]
    : undefined;
}

function buildEvidencesList(rawEvRows: Form5EvidenceDbRow[]): Form5EvidenceItem[] {
  const result: Form5EvidenceItem[] = [];
  const seenKeys = new Set<string>();
  const hasAnyLinkedEvidence = rawEvRows.some((ev) => Boolean(resolveEvidenceRowLink(ev)));

  rawEvRows.forEach((ev) => {
    const rawText = (ev.evidence_text || '').trim();
    const rawLink = resolveEvidenceRowLink(ev);

    // If this requirement has linked evidence files, ignore leftover unlinked template lines
    if (hasAnyLinkedEvidence && !rawLink) {
      return;
    }

    if (!rawLink && isPlaceholderEvidenceText(rawText)) {
      return;
    }

    const dedupeKey = rawLink ? `link::${rawLink}::${rawText.toLowerCase()}` : `text::${rawText.toLowerCase()}`;
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);

    const dbTitle = cleanEvidenceDisplayLabel(rawText);

    result.push({
      id: ev.id,
      title: dbTitle,
      url: rawLink
    });
  });

  return result;
}

function parseCampusForm5Rows(
  campusId: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE',
  campusRows: Form5DbRow[],
  evidencesByParentId: Map<string, Form5EvidenceDbRow[]>
): Form5RequirementItem[] {
  const sorted = [...campusRows].sort((a, b) => a.row_id - b.row_id);

  let lastGeneralIdx = -1;
  let lastSpecialIdx = -1;
  let generalSectionHeader = 'LEARNING RESOURCES FOR GENERAL USE: Other Facilities';
  let specialSectionHeader = 'SPECIAL LEARNING RESOURCES: Laboratory';

  sorted.forEach((r, idx) => {
    const reqText = (r.requirement || '').trim();
    const reqUpper = reqText.toUpperCase();
    if (reqUpper.includes('LEARNING RESOURCES FOR GENERAL USE') && reqUpper.includes('OTHER FACILITIES')) {
      lastGeneralIdx = idx;
      generalSectionHeader = reqText.replace(/\s+/g, ' ').trim();
    } else if (reqUpper.includes('LEARNING RESOURCES FOR GENERAL USE') && idx > 50) {
      lastGeneralIdx = idx;
      generalSectionHeader = reqText.replace(/\s+/g, ' ').trim();
    }
    if (reqUpper.includes('SPECIAL LEARNING RESOURCES')) {
      lastSpecialIdx = idx;
      specialSectionHeader = reqText.replace(/\s+/g, ' ').trim();
    }
  });

  const libSlice = lastGeneralIdx !== -1 ? sorted.slice(0, lastGeneralIdx) : sorted;
  const generalSlice =
    lastGeneralIdx !== -1 && lastSpecialIdx !== -1 && lastSpecialIdx > lastGeneralIdx
      ? sorted.slice(lastGeneralIdx + 1, lastSpecialIdx)
      : [];
  const specialSlice = lastSpecialIdx !== -1 ? sorted.slice(lastSpecialIdx + 1) : [];

  const generalNamesSet = new Set(
    generalSlice.map((g) => (g.requirement || '').trim().toLowerCase()).filter(Boolean)
  );
  const specialNamesSet = new Set(
    specialSlice.map((s) => (s.requirement || '').trim().toLowerCase()).filter(Boolean)
  );

  // Pre-scan libSlice for the last row_id occurrence of each Section 1..9 header and Section 4 subheader
  const lastSectionRowByNum = new Map<number, { rowId: number; headerText: string }>();
  const lastSubSectionRowByName = new Map<string, number>();
  let lastSection9StartFallbackRowId = -1;

  libSlice.forEach((r) => {
    const reqText = (r.requirement || '').trim();
    const descText = (r.description || '').trim();
    const secMatch = reqText.match(/^Section\s*(\d+)/i);
    if (secMatch) {
      const secNum = Number(secMatch[1]);
      lastSectionRowByNum.set(secNum, {
        rowId: r.row_id,
        headerText: reqText.replace(/\s+/g, ' ').trim()
      });
    }
    if (/^a\.\s*The librarians shall engage in local/i.test(reqText)) {
      lastSection9StartFallbackRowId = r.row_id;
    }
    if (
      (reqText === 'a. Selection and Acquisition' ||
        reqText === 'b. Library Holdings' ||
        reqText === 'Organization' ||
        reqText === 'Preservation') &&
      !descText
    ) {
      lastSubSectionRowByName.set(reqText, r.row_id);
    }
  });

  // 1. Parse and deduplicate Library Requirements (Sections 1-9) using exact database texts
  const libDedupMap = new Map<
    string,
    {
      id: string;
      rowId: number;
      sectionTag: string;
      subSectionTag?: string;
      requirement: string;
      rawDesc: string | null;
      rawEvs: Form5EvidenceDbRow[];
    }
  >();

  let currentSection = 'Section 1. Vision, Mission, Goals & Objectives';
  let currentSubSection = '';

  libSlice.forEach((r) => {
    const reqText = (r.requirement || '').trim();
    const descText = (r.description || '').trim();
    const rowEvs = evidencesByParentId.get(r.id) || [];

    if (!reqText) return;
    if (
      reqText.startsWith('Requirements') ||
      reqText.toUpperCase().includes('LEARNING RESOURCES FOR GENERAL USE') ||
      reqText.toUpperCase().includes('SPECIAL LEARNING RESOURCES') ||
      reqText === 'Facility' ||
      reqText === 'College Gymnasium' ||
      reqText === 'IT Computer Laboratory Building, Main Campus' ||
      reqText === 'Multi-Purpose Center' ||
      generalNamesSet.has(reqText.toLowerCase()) ||
      specialNamesSet.has(reqText.toLowerCase())
    ) {
      return;
    }

    const secMatch = reqText.match(/^Section\s*(\d+)/i);
    if (secMatch) {
      const secNum = Number(secMatch[1]);
      const lastSec = lastSectionRowByNum.get(secNum);
      if (lastSec && lastSec.rowId === r.row_id) {
        currentSection = lastSec.headerText;
        currentSubSection = '';
      }
      return;
    }

    if (
      !lastSectionRowByNum.has(9) &&
      r.row_id === lastSection9StartFallbackRowId &&
      /^a\.\s*The librarians shall engage in local/i.test(reqText)
    ) {
      currentSection = 'Section 9. Linkages and Networking';
      currentSubSection = '';
    }

    if (
      (reqText === 'a. Selection and Acquisition' ||
        reqText === 'b. Library Holdings' ||
        reqText === 'Organization' ||
        reqText === 'Preservation') &&
      !descText
    ) {
      if (lastSubSectionRowByName.get(reqText) === r.row_id) {
        currentSubSection = reqText;
      }
      return;
    }

    // Skip stale leftover rows that have no evidences and no narrative (except in Section 4)
    if (
      rowEvs.length === 0 &&
      isPlaceholderNarrative(descText) &&
      !currentSection.toLowerCase().startsWith('section 4')
    ) {
      return;
    }

    const baseKey = normalizeReqDedupeKey(reqText);
    const dedupeKey = reqText.toLowerCase().includes('dedicated learning spaces')
      ? `${currentSection}::${baseKey}`
      : baseKey;

    if (libDedupMap.has(dedupeKey)) {
      const existing = libDedupMap.get(dedupeKey)!;
      if (rowEvs.length > 0 || existing.rawEvs.length === 0) {
        existing.sectionTag = currentSection;
        if (currentSubSection) existing.subSectionTag = currentSubSection;
      }
      existing.rawEvs = [...rowEvs, ...existing.rawEvs];
      if (!isPlaceholderNarrative(descText)) {
        existing.rawDesc = descText;
      }
    } else {
      libDedupMap.set(dedupeKey, {
        id: r.id,
        rowId: r.row_id,
        sectionTag: currentSection,
        subSectionTag: currentSubSection || undefined,
        requirement: reqText,
        rawDesc: r.description,
        rawEvs: [...rowEvs]
      });
    }
  });

  const libraryItems: Form5RequirementItem[] = Array.from(libDedupMap.values()).map((item) => {
    const evidences = buildEvidencesList(item.rawEvs);
    const description = normalizeDatabaseNarrative(item.rawDesc);
    const hasEvidence = evidences.length > 0 || Boolean(description);

    return {
      id: item.id,
      rowId: item.rowId,
      campusName: campusId,
      sectionTag: item.sectionTag,
      subSectionTag: item.subSectionTag,
      requirement: item.requirement,
      description,
      category: 'library',
      status: hasEvidence ? 'With evidence' : 'Pending',
      evidences
    };
  });

  libraryItems.sort((a, b) => {
    const secA = Number((a.sectionTag.match(/Section\s*(\d+)/i) || [])[1] || 99);
    const secB = Number((b.sectionTag.match(/Section\s*(\d+)/i) || [])[1] || 99);
    if (secA !== secB) return secA - secB;
    return a.rowId - b.rowId;
  });

  // 2. Parse Other Facilities for General Use using exact database texts
  const facilityItems: Form5RequirementItem[] = [];
  generalSlice.forEach((r) => {
    const reqText = (r.requirement || '').trim();
    if (
      !reqText ||
      reqText === 'Facility' ||
      reqText.toUpperCase().includes('LEARNING RESOURCES') ||
      reqText.toUpperCase().includes('SPECIAL LEARNING') ||
      specialNamesSet.has(reqText.toLowerCase())
    ) {
      return;
    }
    const rowEvs = evidencesByParentId.get(r.id) || [];
    const evidences = buildEvidencesList(rowEvs);
    const description = normalizeDatabaseNarrative(r.description);
    const hasEvidence = evidences.length > 0;

    facilityItems.push({
      id: r.id,
      rowId: r.row_id,
      campusName: campusId,
      sectionTag: generalSectionHeader,
      requirement: reqText,
      description,
      category: 'facility',
      status: hasEvidence ? 'With evidence' : 'Pending',
      evidences
    });
  });

  // 3. Parse Special Learning Resources — Laboratories using exact database texts
  const laboratoryItems: Form5RequirementItem[] = [];
  specialSlice.forEach((r) => {
    const reqText = (r.requirement || '').trim();
    if (
      !reqText ||
      reqText === 'Facility' ||
      reqText.toUpperCase().includes('LEARNING RESOURCES') ||
      reqText.toUpperCase().includes('SPECIAL LEARNING')
    ) {
      return;
    }
    const rowEvs = evidencesByParentId.get(r.id) || [];
    const evidences = buildEvidencesList(rowEvs);
    const description = normalizeDatabaseNarrative(r.description);
    const hasEvidence = evidences.length > 0;

    laboratoryItems.push({
      id: r.id,
      rowId: r.row_id,
      campusName: campusId,
      sectionTag: specialSectionHeader,
      requirement: reqText,
      description,
      category: 'laboratory',
      status: hasEvidence ? 'With evidence' : 'Pending',
      evidences
    });
  });

  return [...libraryItems, ...facilityItems, ...laboratoryItems];
}

export async function fetchAllForm5Data(): Promise<Record<string, Form5RequirementItem[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const [form5Res, evidencesRes] = await Promise.all([
    supabase
      .from('form5')
      .select('id,campus_name,row_id,requirement,description')
      .order('row_id', { ascending: true })
      .limit(2000),
    supabase
      .from('form5_evidences')
      .select('id,parent_id,source_row,evidence_text,drive_link')
      .gte('id', 985)
      .order('id', { ascending: true })
      .limit(2000)
  ]);

  if (form5Res.error) {
    throw new Error(`form5 table error: ${form5Res.error.message}`);
  }
  if (evidencesRes.error) {
    throw new Error(`form5_evidences table error: ${evidencesRes.error.message}`);
  }

  const rawForm5: Form5DbRow[] = form5Res.data || [];
  const rawEvidences: Form5EvidenceDbRow[] = evidencesRes.data || [];

  const evidencesByParentId = new Map<string, Form5EvidenceDbRow[]>();
  rawEvidences.forEach((ev) => {
    if (!ev.parent_id) return;
    const key = ev.parent_id.trim();
    if (!evidencesByParentId.has(key)) {
      evidencesByParentId.set(key, []);
    }
    evidencesByParentId.get(key)!.push(ev);
  });

  const groupedByCampus: Record<string, Form5RequirementItem[]> = {
    Main: [],
    Pagadian: [],
    Dumingag: [],
    CMSE: []
  };

  CAMPUS_TABS.forEach((c) => {
    const campusRows = rawForm5.filter(
      (r) => (r.campus_name || '').trim().toLowerCase() === c.id.toLowerCase()
    );
    groupedByCampus[c.id] = parseCampusForm5Rows(c.id, campusRows, evidencesByParentId);
  });

  cachedForm5ByCampus = groupedByCampus;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FORM5_CACHE_KEY, JSON.stringify(groupedByCampus));
    }
  } catch {}

  return groupedByCampus;
}

export function preloadForm5Data(): Promise<Record<string, Form5RequirementItem[]> | null> {
  if (cachedForm5ByCampus) return Promise.resolve(cachedForm5ByCampus);
  if (prefetchForm5Promise) return prefetchForm5Promise;

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(FORM5_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.Main && parsed.Main.length > 0) {
          cachedForm5ByCampus = parsed;
        }
      }
    } catch {}
  }

  prefetchForm5Promise = fetchAllForm5Data()
    .catch((err) => {
      console.warn('Form 5 background preload failed:', err);
      return cachedForm5ByCampus;
    })
    .finally(() => {
      prefetchForm5Promise = null;
    });

  return prefetchForm5Promise;
}

interface ViewerModalState {
  title: string;
  subtitle?: string;
  pages: string[];
  activeIndex?: number;
  docsUrl?: string;
}

export const Form5Page: React.FC = () => {
  const [activeCampusId, setActiveCampusId] = useState<'Main' | 'Pagadian' | 'Dumingag' | 'CMSE'>('Main');
  const [allCampusData, setAllCampusData] = useState<Record<string, Form5RequirementItem[]>>(() => {
    if (cachedForm5ByCampus) return cachedForm5ByCampus;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(FORM5_CACHE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.Main) {
            cachedForm5ByCampus = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return { Main: [], Pagadian: [], Dumingag: [], CMSE: [] };
  });

  const [loading, setLoading] = useState<boolean>(() => !cachedForm5ByCampus || !cachedForm5ByCampus.Main?.length);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSectionTag, setActiveSectionTag] = useState<string>('');
  const [detailModalItem, setDetailModalItem] = useState<Form5RequirementItem | null>(null);
  const [viewerModal, setViewerModal] = useState<ViewerModalState | null>(null);

  const activeCampus = useMemo(() => {
    return CAMPUS_TABS.find((c) => c.id === activeCampusId) || CAMPUS_TABS[0];
  }, [activeCampusId]);

  const loadSupabaseForm5Data = async () => {
    try {
      if (!cachedForm5ByCampus || !cachedForm5ByCampus.Main?.length) {
        setLoading(true);
      }
      setError(null);
      const freshData = await fetchAllForm5Data();
      setAllCampusData(freshData);
    } catch (err: any) {
      console.error('Error fetching Supabase Form 5 data:', err);
      setError(err.message || 'Failed to query Supabase form5 and form5_evidences tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseForm5Data();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('form5_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form5' }, () => {
        loadSupabaseForm5Data();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form5_evidences' }, () => {
        loadSupabaseForm5Data();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!viewerModal && !detailModalItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewerModal(null);
        setDetailModalItem(null);
      } else if (viewerModal) {
        if (e.key === 'ArrowRight' && viewerModal.pages.length > 1) {
          setViewerModal((prev) =>
            prev ? { ...prev, activeIndex: ((prev.activeIndex ?? 0) + 1) % prev.pages.length } : null
          );
        } else if (e.key === 'ArrowLeft' && viewerModal.pages.length > 1) {
          setViewerModal((prev) =>
            prev
              ? { ...prev, activeIndex: ((prev.activeIndex ?? 0) - 1 + prev.pages.length) % prev.pages.length }
              : null
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerModal, detailModalItem]);

  const requirements = useMemo(() => {
    return allCampusData[activeCampus.id] || [];
  }, [allCampusData, activeCampus.id]);

  // Build Left Sidebar Menu strictly from the exact sectionTag values in the database
  const sectionMenu = useMemo(() => {
    const map = new Map<string, { sectionTag: string; count: number; category: 'library' | 'facility' | 'laboratory' }>();

    requirements.forEach((r) => {
      if (!r.sectionTag) return;
      if (!map.has(r.sectionTag)) {
        map.set(r.sectionTag, {
          sectionTag: r.sectionTag,
          count: 0,
          category: r.category
        });
      }
      map.get(r.sectionTag)!.count += 1;
    });

    return Array.from(map.values());
  }, [requirements]);

  useEffect(() => {
    if (sectionMenu.length > 0 && !sectionMenu.some((s) => s.sectionTag === activeSectionTag)) {
      setActiveSectionTag(sectionMenu[0].sectionTag);
    }
  }, [sectionMenu, activeSectionTag]);

  const displayedItems = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return requirements.filter(
        (r) =>
          r.requirement.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.sectionTag.toLowerCase().includes(q) ||
          (r.subSectionTag && r.subSectionTag.toLowerCase().includes(q)) ||
          r.evidences.some((e) => e.title.toLowerCase().includes(q))
      );
    }
    return requirements.filter((r) => r.sectionTag === activeSectionTag);
  }, [requirements, activeSectionTag, searchQuery]);

  const openPhotoGallery = (title: string, subtitle: string, photos: string[], docsUrl?: string) => {
    if (!photos || photos.length === 0) return;
    setViewerModal({
      title,
      subtitle,
      pages: photos,
      activeIndex: 0,
      docsUrl
    });
  };

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Pine Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 5"
        title="Form 5: Learning resources"
        subtitle="4 campuses — Library sections, facilities, and laboratories by campus."
        highlightNumber="4 campuses"
      />

      {/* White rounded card overlapping the bottom ~80px of the Pine band */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        {/* Main Card Container */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)] space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadSupabaseForm5Data}
                className="inline-flex items-center gap-1 underline font-bold text-[#1E4D2B] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Top Bar: Campus Tabs + Search + Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E9E2]">
            <div className="flex flex-wrap items-center gap-2">
              {CAMPUS_TABS.map((tab) => {
                const isActive = activeCampusId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCampusId(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#15221A]'
                    }`}
                  >
                    {tab.tabLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-7 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#15221A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0E3322]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <a
                href={FORM5_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View spreadsheet</span>
              </a>
            </div>
          </div>

          {/* Two-Column Layout: Left Database Section Menu + Right Database Cards */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Sidebar: Exact Section Names from Database */}
            <div className="w-full lg:w-[270px] shrink-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-2 px-1">
                Sections
              </div>

              {/* Mobile Dropdown */}
              <div className="lg:hidden mb-2">
                <select
                  value={activeSectionTag}
                  onChange={(e) => {
                    setActiveSectionTag(e.target.value);
                    setSearchQuery('');
                  }}
                  aria-label="Select section"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAFBF8] text-xs font-bold text-[#0E3322]"
                >
                  {sectionMenu.map((sec) => (
                    <option key={sec.sectionTag} value={sec.sectionTag}>
                      {sec.sectionTag} ({sec.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Vertical Menu */}
              <div className="hidden lg:flex flex-col gap-1">
                {sectionMenu.map((sec) => {
                  const isSelected = !searchQuery.trim() && activeSectionTag === sec.sectionTag;
                  return (
                    <button
                      key={sec.sectionTag}
                      type="button"
                      onClick={() => {
                        setActiveSectionTag(sec.sectionTag);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0E3322] text-white shadow-2xs'
                          : 'text-[#334155] hover:bg-[#F4F6F1] hover:text-[#0E3322]'
                      }`}
                    >
                      <span className="line-clamp-2 leading-snug">{sec.sectionTag}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#E8AE1F] text-[#0E3322]'
                            : 'bg-[#EEF1EB] text-[#64748B]'
                        }`}
                      >
                        {sec.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Main Panel: 2-Column Card Grid Using Pure Database Text */}
            <div className="flex-1 min-w-0 w-full">
              {/* Active Section Header (Exact Database Section Tag) */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EEF1EB]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#E8AE1F] shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-[#0E3322]">
                    {searchQuery.trim()
                      ? `Search Results (${displayedItems.length})`
                      : activeSectionTag}
                  </h2>
                </div>
                <span className="text-xs font-medium text-[#64748B]">
                  {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {displayedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedItems.map((item) => {
                    const isSection6 = item.sectionTag.toLowerCase().includes('section 6');
                    const isSection7 = item.sectionTag.toLowerCase().includes('section 7');
                    const isPhotoBannerCard =
                      item.category === 'facility' ||
                      item.category === 'laboratory' ||
                      isSection6 ||
                      isSection7;

                    const photoEvidences: Form5EvidenceItem[] = [];
                    const documentEvidences: Form5EvidenceItem[] = [];

                    if (isPhotoBannerCard) {
                      item.evidences.forEach((ev) => {
                        if (ev.url) {
                          photoEvidences.push(ev);
                        } else {
                          documentEvidences.push(ev);
                        }
                      });
                    } else {
                      item.evidences.forEach((ev) => documentEvidences.push(ev));
                    }

                    const primaryPhotoEvidence =
                      photoEvidences.find(
                        (ev) => getPhotoUrlsForDriveId(extractDriveFileId(ev.url)).galleryPhotos.length > 0
                      ) || photoEvidences[0];
                    const primaryDriveFileId = extractDriveFileId(primaryPhotoEvidence?.url);
                    const facilityPhotos = isPhotoBannerCard
                      ? getPhotoUrlsForDriveId(primaryDriveFileId)
                      : null;

                    const allCardGalleryPhotos = Array.from(
                      new Set(
                        photoEvidences.flatMap(
                          (ev) => getPhotoUrlsForDriveId(extractDriveFileId(ev.url)).galleryPhotos
                        )
                      )
                    );

                    const bannerPhotoSrc =
                      isSection7 && (item.rowId === 131 || item.rowId === 98) && allCardGalleryPhotos.length > 1
                        ? allCardGalleryPhotos[1]
                        : facilityPhotos?.initialPhotoSrc || '';

                    return (
                      <div
                        key={item.id}
                        className="bg-[#FAFBF9] border border-[#DCE3D9] rounded-2xl overflow-hidden hover:border-[#1E4D2B]/40 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Photo Banner for Section 6 (or Pagadian Section 7), Other Facilities, & Laboratories */}
                          {isPhotoBannerCard && facilityPhotos && bannerPhotoSrc && (
                            <div
                              onClick={() =>
                                allCardGalleryPhotos.length > 0 &&
                                openPhotoGallery(
                                  item.requirement,
                                  item.sectionTag,
                                  allCardGalleryPhotos,
                                  primaryPhotoEvidence?.url
                                )
                              }
                              className="group/banner relative w-full h-[140px] overflow-hidden flex items-center justify-center cursor-pointer bg-[#0E3322]"
                            >
                              {item.category === 'laboratory' ? (
                                <FlaskConical className="w-7 h-7 text-[#E8AE1F]/60" />
                              ) : (
                                <Building2 className="w-7 h-7 text-[#E8AE1F]/60" />
                              )}
                              <img
                                src={bannerPhotoSrc}
                                alt={item.requirement}
                                data-drive-thumb={facilityPhotos.driveThumbnailUrl}
                                data-drive-id={primaryDriveFileId || ''}
                                className="absolute inset-0 w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  const fallbackThumb = img.getAttribute('data-drive-thumb');
                                  if (fallbackThumb && img.src !== fallbackThumb) {
                                    img.src = fallbackThumb;
                                    return;
                                  }
                                  img.style.display = 'none';
                                  const driveId = img.getAttribute('data-drive-id');
                                  const parent = img.parentElement;
                                  if (driveId && parent && !parent.querySelector('iframe')) {
                                    const iframe = document.createElement('iframe');
                                    iframe.src = `https://drive.google.com/file/d/${driveId}/preview`;
                                    iframe.title = item.requirement;
                                    iframe.className =
                                      'absolute inset-0 w-full h-[220px] -top-[42px] border-0 pointer-events-none';
                                    parent.appendChild(iframe);
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Card Content: Purely Database `requirement`, `description`, and clean `evidences` links */}
                          <div className="p-5 pb-4">
                            {item.subSectionTag && (
                              <div className="text-[11px] font-bold text-[#1E4D2B] mb-1">
                                {item.subSectionTag}
                              </div>
                            )}

                            <h3 className="text-sm sm:text-[15px] font-bold text-[#0E3322] leading-snug line-clamp-2">
                              {item.requirement}
                            </h3>

                            {item.description && (
                              <p className="text-xs sm:text-[13px] text-[#475569] mt-2 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            {/* Upgraded File Click Buttons for Document Evidences */}
                            {documentEvidences.length > 0 && (
                              <div className="mt-3.5 pt-3 border-t border-[#EEF1EB] space-y-2">
                                {documentEvidences.map((ev, eIdx) => {
                                  const driveFileId = extractDriveFileId(ev.url);
                                  const cleanTitle = cleanEvidenceDisplayLabel(ev.title);
                                  const isPhotoItem = /\b(photos?|pictures?|images?)\b/i.test(cleanTitle);
                                  const media = getEvidenceMedia(driveFileId, isPhotoItem);
                                  const displayLabel =
                                    cleanTitle ||
                                    (media.hasPhotos
                                      ? 'View Photos'
                                      : documentEvidences.length > 1
                                      ? `Supporting Document ${eIdx + 1}`
                                      : 'View Document');

                                  if (media.hasPhotos && media.pages.length > 0) {
                                    return (
                                      <div key={`${ev.id}-${eIdx}`}>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openPhotoGallery(
                                              cleanTitle || item.requirement,
                                              item.sectionTag,
                                              media.pages,
                                              ev.url
                                            )
                                          }
                                          className="group/doc flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl bg-white hover:bg-[#EDF5F0] border border-[#DCE3D9] hover:border-[#1E4D2B]/40 text-xs font-semibold text-[#0E3322] shadow-2xs transition-all cursor-pointer text-left"
                                        >
                                          <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <span className="w-7 h-7 rounded-lg bg-[#E3EFE8] group-hover/doc:bg-[#1E4D2B] text-[#1E4D2B] group-hover/doc:text-white flex items-center justify-center shrink-0 transition-colors">
                                              <Camera className="w-3.5 h-3.5" />
                                            </span>
                                            <span className="leading-snug text-[#0E3322] group-hover/doc:text-[#1E4D2B] break-words">
                                              {displayLabel}
                                            </span>
                                          </span>
                                          <span className="w-6 h-6 rounded-md bg-[#F4F6F1] group-hover/doc:bg-[#1E4D2B]/10 text-[#64748B] group-hover/doc:text-[#1E4D2B] flex items-center justify-center shrink-0 transition-colors">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </span>
                                        </button>
                                      </div>
                                    );
                                  }

                                  if (ev.url) {
                                    return (
                                      <div key={`${ev.id}-${eIdx}`} className="w-full">
                                        <DocumentLinkPreview
                                          url={ev.url}
                                          title={cleanTitle || item.requirement}
                                          text={displayLabel}
                                        >
                                          <a
                                            href={ev.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/doc flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl bg-white hover:bg-[#EDF5F0] border border-[#DCE3D9] hover:border-[#1E4D2B]/40 text-xs font-semibold text-[#0E3322] shadow-2xs transition-all cursor-pointer text-left"
                                          >
                                            <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                              <span className="w-7 h-7 rounded-lg bg-[#E3EFE8] group-hover/doc:bg-[#1E4D2B] text-[#1E4D2B] group-hover/doc:text-white flex items-center justify-center shrink-0 transition-colors">
                                                <FileText className="w-3.5 h-3.5" />
                                              </span>
                                              <span className="leading-snug text-[#0E3322] group-hover/doc:text-[#1E4D2B] break-words">
                                                {displayLabel}
                                              </span>
                                            </span>
                                            <span className="w-6 h-6 rounded-md bg-[#F4F6F1] group-hover/doc:bg-[#1E4D2B]/10 text-[#64748B] group-hover/doc:text-[#1E4D2B] flex items-center justify-center shrink-0 transition-colors">
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </span>
                                          </a>
                                        </DocumentLinkPreview>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={`${ev.id}-${eIdx}`}
                                      className="text-xs text-[#475569] leading-snug"
                                    >
                                      {displayLabel}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Details Trigger + Section 6 / Facility / Lab Photo Action */}
                        <div className="px-5 py-3 border-t border-[#E5E9E2] flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailModalItem(item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#475569] hover:text-[#0E3322] cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </button>

                          {isPhotoBannerCard && allCardGalleryPhotos.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                openPhotoGallery(
                                  item.requirement,
                                  item.sectionTag,
                                  allCardGalleryPhotos,
                                  primaryPhotoEvidence?.url
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E3EFE8]/80 hover:bg-[#1E4D2B] text-[#1E4D2B] hover:text-white border border-[#1E4D2B]/20 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 shrink-0" />
                              <span>View photos</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#64748B] bg-[#FAFBF8] rounded-2xl border border-dashed border-[#CBD5E1]">
                  {loading
                    ? `Loading records for ${activeCampus.fullLabel}...`
                    : 'No matching items found.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Database Requirement & Description Modal (Purely Database Text) */}
      {detailModalItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailModalItem(null)}
        >
          <div
            className="bg-white border border-[#DCE3D9] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0E3322] text-white px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#E8AE1F]">
                  {detailModalItem.sectionTag}
                </div>
                {detailModalItem.subSectionTag && (
                  <div className="text-xs font-semibold text-white/90 mt-0.5">
                    {detailModalItem.subSectionTag}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1">
                  Requirement
                </div>
                <p className="font-semibold text-[#0E3322] leading-relaxed whitespace-pre-line">
                  {detailModalItem.requirement}
                </p>
              </div>

              {detailModalItem.description && (
                <div className="pt-3 border-t border-[#E5E9E2]">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1">
                    Description
                  </div>
                  <p className="text-[#334155] leading-relaxed whitespace-pre-line">
                    {detailModalItem.description}
                  </p>
                </div>
              )}

              {detailModalItem.evidences.length > 0 && (
                <div className="pt-3 border-t border-[#E5E9E2]">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-2">
                    Evidences
                  </div>
                  <div className="space-y-2">
                    {detailModalItem.evidences.map((ev, eIdx) => {
                      const driveFileId = extractDriveFileId(ev.url);
                      const cleanTitle = cleanEvidenceDisplayLabel(ev.title);
                      const modalSectionLower = detailModalItem.sectionTag.toLowerCase();
                      const isPhotoCategory =
                        detailModalItem.category === 'facility' ||
                        detailModalItem.category === 'laboratory' ||
                        modalSectionLower.includes('section 6') ||
                        modalSectionLower.includes('section 7') ||
                        /\b(photos?|pictures?|images?)\b/i.test(cleanTitle);
                      const media = getEvidenceMedia(driveFileId, isPhotoCategory);
                      const displayLabel =
                        cleanTitle ||
                        (media.hasPhotos
                          ? 'View Photos'
                          : detailModalItem.evidences.length > 1
                          ? `Supporting Document ${eIdx + 1}`
                          : 'View Document');

                      if (media.hasPhotos && media.pages.length > 0) {
                        return (
                          <div key={`${ev.id}-${eIdx}`}>
                            <button
                              type="button"
                              onClick={() => {
                                const item = detailModalItem;
                                setDetailModalItem(null);
                                openPhotoGallery(
                                  cleanTitle || item.requirement,
                                  item.sectionTag,
                                  media.pages,
                                  ev.url
                                );
                              }}
                              className="group/doc flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl bg-[#FAFBF9] hover:bg-[#EDF5F0] border border-[#DCE3D9] hover:border-[#1E4D2B]/40 text-xs font-semibold text-[#0E3322] shadow-2xs transition-all cursor-pointer text-left"
                            >
                              <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="w-7 h-7 rounded-lg bg-[#E3EFE8] group-hover/doc:bg-[#1E4D2B] text-[#1E4D2B] group-hover/doc:text-white flex items-center justify-center shrink-0 transition-colors">
                                  <Camera className="w-3.5 h-3.5" />
                                </span>
                                <span className="leading-snug text-[#0E3322] group-hover/doc:text-[#1E4D2B] break-words">
                                  {displayLabel}
                                </span>
                              </span>
                              <span className="w-6 h-6 rounded-md bg-[#F4F6F1] group-hover/doc:bg-[#1E4D2B]/10 text-[#64748B] group-hover/doc:text-[#1E4D2B] flex items-center justify-center shrink-0 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </button>
                          </div>
                        );
                      }

                      if (ev.url) {
                        return (
                          <div key={`${ev.id}-${eIdx}`} className="w-full">
                            <DocumentLinkPreview
                              url={ev.url}
                              title={cleanTitle || detailModalItem.requirement}
                              text={displayLabel}
                            >
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/doc flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl bg-[#FAFBF9] hover:bg-[#EDF5F0] border border-[#DCE3D9] hover:border-[#1E4D2B]/40 text-xs font-semibold text-[#0E3322] shadow-2xs transition-all cursor-pointer text-left"
                              >
                                <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className="w-7 h-7 rounded-lg bg-[#E3EFE8] group-hover/doc:bg-[#1E4D2B] text-[#1E4D2B] group-hover/doc:text-white flex items-center justify-center shrink-0 transition-colors">
                                    <FileText className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="leading-snug text-[#0E3322] group-hover/doc:text-[#1E4D2B] break-words">
                                    {displayLabel}
                                  </span>
                                </span>
                                <span className="w-6 h-6 rounded-md bg-[#F4F6F1] group-hover/doc:bg-[#1E4D2B]/10 text-[#64748B] group-hover/doc:text-[#1E4D2B] flex items-center justify-center shrink-0 transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </span>
                              </a>
                            </DocumentLinkPreview>
                          </div>
                        );
                      }

                      return (
                        <div key={`${ev.id}-${eIdx}`} className="text-xs text-[#334155]">
                          {displayLabel}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-[#FAFBF9] border-t border-[#DCE3D9] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-1.5 rounded-lg border border-[#CBD5E1] text-[#334155] text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal (Only for items with photos) */}
      {viewerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => setViewerModal(null)}
        >
          <div
            className="bg-white border border-[#DCE3D9] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-w-4xl w-full max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0E3322] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 shrink-0">
              <div className="min-w-0 flex-1">
                {viewerModal.subtitle && (
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#E8AE1F] mb-0.5">
                    {viewerModal.subtitle}
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {viewerModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {viewerModal.pages.length > 1 && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-[#F5F2E6] text-xs font-bold">
                    {(viewerModal.activeIndex ?? 0) + 1} / {viewerModal.pages.length}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setViewerModal(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer ml-1"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Canvas */}
            <div className="relative bg-[#0B1F15] flex-1 min-h-[320px] sm:min-h-[440px] max-h-[65vh] flex items-center justify-center overflow-hidden select-none">
              <img
                key={viewerModal.pages[viewerModal.activeIndex ?? 0]}
                src={viewerModal.pages[viewerModal.activeIndex ?? 0]}
                alt={viewerModal.title}
                data-drive-id={extractDriveFileId(viewerModal.docsUrl) || ''}
                className="max-w-full max-h-[62vh] object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const driveId = img.getAttribute('data-drive-id');
                  const parent = img.parentElement;
                  if (driveId && parent && !parent.querySelector('iframe')) {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://drive.google.com/file/d/${driveId}/preview`;
                    iframe.title = viewerModal.title;
                    iframe.className = 'w-full h-[62vh] border-0';
                    parent.appendChild(iframe);
                  }
                }}
              />

              {viewerModal.pages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setViewerModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              activeIndex:
                                ((prev.activeIndex ?? 0) - 1 + prev.pages.length) % prev.pages.length
                            }
                          : null
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0E3322]/85 hover:bg-[#0E3322] text-white border border-white/20 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setViewerModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              activeIndex: ((prev.activeIndex ?? 0) + 1) % prev.pages.length
                            }
                          : null
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0E3322]/85 hover:bg-[#0E3322] text-white border border-white/20 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#FAFBF9] border-t border-[#DCE3D9] flex flex-wrap items-center justify-between gap-3 shrink-0">
              {viewerModal.pages.length > 1 ? (
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  {viewerModal.pages.map((pUrl, pIdx) => {
                    const isSelected = pIdx === (viewerModal.activeIndex ?? 0);
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() =>
                          setViewerModal((prev) => (prev ? { ...prev, activeIndex: pIdx } : null))
                        }
                        className={`relative w-14 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'border-[#E8AE1F] ring-2 ring-[#E8AE1F]/30 scale-105'
                            : 'border-[#DCE3D9] opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img src={pUrl} alt={`${pIdx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5 ml-auto">
                {viewerModal.docsUrl && (
                  <a
                    href={viewerModal.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F5F2E6] hover:bg-[#FBF1D2] text-[#0E3322] border border-[#DCE3D9] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open File</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewerModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#0E3322] hover:bg-[#1E4D2B] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
