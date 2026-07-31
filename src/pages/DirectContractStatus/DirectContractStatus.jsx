import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Web3 from "web3";
import BrowseJobsABI from "../../ABIs/nowjc_ABI.json";
import BackButton from "../../components/BackButton/BackButton";
import CrossChainStatus, {
  buildPaymentSteps,
} from "../../components/CrossChainStatus/CrossChainStatus";
import Warning from "../../components/Warning/Warning";
import { getNativeChain } from "../../config/chainConfig";
import {
  monitorCCTPTransfer,
  monitorLZMessage,
  pollOnChainJobState,
  STATUS,
} from "../../utils/crossChainMonitor";
import {
  clearDirectContractProgress,
  loadDirectContractProgress,
} from "../../utils/directContractReceipt";
import "./DirectContractStatus.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function DirectContractStatus() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const completedRef = useRef(false);
  const routeProgress = location.state?.progress;
  const progress = useMemo(() => (
    routeProgress?.jobId === jobId
      ? routeProgress
      : loadDirectContractProgress(jobId)
  ), [jobId, routeProgress]);
  const nativeChain = useMemo(() => getNativeChain(), []);
  const [notice, setNotice] = useState(() => (
    progress
      ? {
          message: "Your source transaction is confirmed. Syncing the contract to Arbitrum now…",
          variant: "info",
        }
      : {
          message: "This saved transaction could not be found. Open Browse Jobs to check whether the contract is already available.",
          variant: "warning",
        }
  ));
  const [journey, setJourney] = useState(() => (
    progress
      ? {
          sourceChainId: Number(progress.sourceChainId),
          usdcApproved: true,
          sourceTxHash: progress.sourceTxHash,
          lzStatus: "active",
          lzLink: `https://layerzeroscan.com/tx/${progress.sourceTxHash}`,
          cctpBurnTxHash: progress.sourceTxHash,
          cctpSourceDomain: Number(progress.sourceDomain),
          circleLink: `https://iris-api.circle.com/v2/messages/${progress.sourceDomain}?transactionHash=${progress.sourceTxHash}`,
          destChainId: nativeChain?.chainId,
        }
      : {}
  ));

  const steps = useMemo(() => (
    progress ? buildPaymentSteps(journey) : []
  ), [journey, progress]);

  useEffect(() => {
    if (!progress || !nativeChain || completedRef.current) {
      return undefined;
    }

    let backendStatusTimer;
    let timeoutTimer;

    const finish = () => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      clearDirectContractProgress(jobId);
      setJourney((current) => ({
        ...current,
        lzStatus: "delivered",
        cctpAttestationStatus: "complete",
      }));
      setNotice({
        message: "Direct contract confirmed on Arbitrum. Opening it now…",
        variant: "success",
      });
      navigate(`/job-details/${jobId}`, { replace: true });
    };

    fetch(`${BACKEND_URL}/api/start-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        txHash: progress.sourceTxHash,
      }),
    }).catch((error) => {
      console.warn("Could not start the backend relay monitor:", error);
      setNotice({
        message: "The relay service is temporarily unavailable, but on-chain confirmation is still being monitored. Do not submit the contract again.",
        variant: "warning",
      });
    });

    const stopOnChainPoll = pollOnChainJobState(
      new Web3(nativeChain.rpcUrl),
      nativeChain.contracts.genesis,
      BrowseJobsABI,
      jobId,
      { milestone: 0, totalPaid: "0", mode: "sync" },
      finish,
      { pollInterval: 10000, maxAttempts: 120 },
    );

    const stopLayerZeroMonitor = monitorLZMessage(
      progress.sourceTxHash,
      (update) => {
        setJourney((current) => ({
          ...current,
          lzStatus: update.status === STATUS.SUCCESS
            ? "delivered"
            : update.status === STATUS.FAILED
              ? "failed"
              : "active",
          lzLink: update.lzLink || current.lzLink,
          lzDstTxHash: update.dstTxHash || current.lzDstTxHash,
          lzDstChainId: nativeChain.chainId,
        }));
      },
      { pollInterval: 6000, maxAttempts: 100 },
    );

    const stopCctpMonitor = monitorCCTPTransfer(
      progress.sourceTxHash,
      Number(progress.sourceDomain),
      (update) => {
        setJourney((current) => ({
          ...current,
          cctpAttestationStatus: update.status === STATUS.SUCCESS
            ? "complete"
            : update.message?.includes("slow")
              ? "slow"
              : "pending",
          circleLink: update.circleLink || current.circleLink,
        }));
      },
      () => {
        setJourney((current) => ({
          ...current,
          cctpAttestationStatus: "complete",
        }));
      },
      { pollInterval: 8000, maxAttempts: 100 },
    );

    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/start-job-status/${jobId}`);
        if (!response.ok) {
          return;
        }
        const status = await response.json();
        if (status.status === "polling_attestation") {
          setJourney((current) => ({
            ...current,
            cctpAttestationStatus: "pending",
          }));
        } else if (status.status === "executing_receive") {
          setJourney((current) => ({
            ...current,
            cctpAttestationStatus: "complete",
          }));
        } else if (status.status === "completed") {
          setJourney((current) => ({
            ...current,
            cctpAttestationStatus: "complete",
            cctpMintTxHash: status.completionTxHash === "already_completed"
              ? current.cctpMintTxHash
              : status.completionTxHash,
          }));
        } else if (status.status === "failed") {
          setNotice({
            message: "The relay service reported a problem, but the source transaction is confirmed and on-chain delivery is still being checked. Do not submit again.",
            variant: "warning",
          });
        }
      } catch (error) {
        console.warn("Could not read relay status:", error);
      }
    };

    checkBackendStatus();
    backendStatusTimer = window.setInterval(checkBackendStatus, 8000);
    timeoutTimer = window.setTimeout(() => {
      setNotice({
        message: "Cross-chain delivery is taking longer than usual. This page will keep checking; you can also return later without submitting again.",
        variant: "warning",
      });
    }, 10 * 60 * 1000);

    return () => {
      stopOnChainPoll();
      stopLayerZeroMonitor();
      stopCctpMonitor();
      window.clearInterval(backendStatusTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [jobId, nativeChain, navigate, progress]);

  return (
    <div className="direct-contract-status">
      <BackButton to="/work" title="Direct Contract Progress" />
      <div className="direct-contract-status__card">
        <h1>Contract transaction confirmed</h1>
        <p>
          You can leave this page and return later. Your progress is saved in
          this browser, and submitting again is not necessary.
        </p>
        <Warning content={notice.message} variant={notice.variant} />
        {progress && (
          <CrossChainStatus
            title={`Contract ${jobId}`}
            steps={steps}
          />
        )}
        {!progress && (
          <button
            className="direct-contract-status__browse"
            type="button"
            onClick={() => navigate("/browse-jobs")}
          >
            Browse Jobs
          </button>
        )}
      </div>
    </div>
  );
}
